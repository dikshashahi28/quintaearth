// Replace one kind of tag on one entity. Returns statements so callers can put them in their D1 batch.
import { and, eq } from 'drizzle-orm';
import { db, schema } from '../db/client';

type EntityType = 'profile' | 'organization' | 'listing';
type Kind = 'industry' | 'sub' | 'sdg' | 'skill' | 'serves';

export function setTags(entityType: EntityType, entityId: string, kind: Kind, values: string[]) {
  const t = schema.tags;
  const clear = db.delete(t).where(and(eq(t.entityType, entityType), eq(t.entityId, entityId), eq(t.kind, kind)));
  // D1 binds at most 100 values per statement and each row binds 4, so long lists go in several inserts
  const rows = values.map((value) => ({ entityType, entityId, kind, value }));
  const inserts = [];
  for (let i = 0; i < rows.length; i += 20) inserts.push(db.insert(t).values(rows.slice(i, i + 20)));
  return [clear, ...inserts];
}

export function clearAllTags(entityType: EntityType, entityId: string) {
  return db.delete(schema.tags).where(and(eq(schema.tags.entityType, entityType), eq(schema.tags.entityId, entityId)));
}

export async function tagsOf(entityType: EntityType, entityId: string) {
  const rows = await db.select({ kind: schema.tags.kind, value: schema.tags.value }).from(schema.tags)
    .where(and(eq(schema.tags.entityType, entityType), eq(schema.tags.entityId, entityId)));
  const out: Record<Kind, string[]> = { industry: [], sub: [], sdg: [], skill: [], serves: [] };
  for (const r of rows) out[r.kind].push(r.value);
  return out;
}
