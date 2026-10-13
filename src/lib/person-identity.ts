// The person "Identity checked" badge: a member who has linked a LinkedIn account through LinkedIn sign-in (OAuth).
// No phone check and no government ID (12 Oct). Decided from the account table when a page is read.
import { and, eq, inArray, sql } from 'drizzle-orm';
import { db, schema } from '../db/client';
import { inChunks } from '../db/chunks';

export const PERSON_TOOLTIP = 'Signed in with LinkedIn: a LinkedIn account is linked to this profile. Not an endorsement or a sustainability claim.';

export async function personChecked(userId: string): Promise<boolean> {
  return !!(await db.query.account.findFirst({ where: and(eq(schema.account.userId, userId), eq(schema.account.providerId, 'linkedin')), columns: { id: true } }));
}

/** which of these users have LinkedIn linked */
export async function personsChecked(userIds: string[]): Promise<Set<string>> {
  const rows = await inChunks([...new Set(userIds)], (slice) => db.select({ userId: schema.account.userId }).from(schema.account)
    .where(and(inArray(schema.account.userId, slice), eq(schema.account.providerId, 'linkedin'))));
  return new Set(rows.map((r) => r.userId));
}

/** SQL: the profile row aliased `p` belongs to a member with LinkedIn linked */
export const personCheckedSql = (p = 'p') => sql.raw(`EXISTS (SELECT 1 FROM account a WHERE a.user_id = ${p}.user_id AND a.provider_id = 'linkedin')`);
