// A small counter for anything that sends email or checks a secret, kept in D1 (the sign_in_failures table, whose
// rows are just "key, time"). Each rule is a key and how many events it may see in its window; rows older than a
// day are pruned as new ones arrive.
// Counting and recording are ONE statement (an insert that only happens while every rule is under its limit), so
// a burst of parallel requests cannot all read "under the limit" and all go through, as with storage.putFile.
import { inArray, lt, sql } from 'drizzle-orm';
import { ActionError } from 'astro:actions';
import { db, schema } from '../db/client';

export interface Rule { key: string; limit: number; windowMs: number }
export const HOUR = 60 * 60_000;
export const DAY = 24 * HOUR;

/**
 * Records one event under every rule, but only if every rule is still under its limit; returns the ids of the rows
 * written (to hand the slot back with `release`), or null when a rule is at its limit and nothing was written.
 */
export async function take(rules: Rule[]): Promise<number[] | null> {
  if (!rules.length) return [];
  const now = Date.now();
  const rows = sql.join(rules.map(({ key }) => sql`(${key}, ${now})`), sql`, `);
  const under = sql.join(rules.map(({ key, limit, windowMs }) =>
    sql`(SELECT count(*) FROM sign_in_failures WHERE key = ${key} AND at > ${now - windowMs}) < ${limit}`), sql` AND `);
  const written = await db.all<{ id: number }>(sql`INSERT INTO sign_in_failures (key, at) SELECT column1, column2 FROM (VALUES ${rows}) WHERE ${under} RETURNING id`);
  await db.delete(schema.signInFailures).where(lt(schema.signInFailures.at, new Date(now - DAY)));
  return written.length ? written.map((r) => r.id) : null;
}

/** gives back slots taken with `take` (e.g. a sign-in attempt that turned out right is not a failure) */
export async function release(ids: number[]): Promise<void> {
  if (ids.length) await db.delete(schema.signInFailures).where(inArray(schema.signInFailures.id, ids));
}

/** throws TOO_MANY_REQUESTS when any rule is at its limit, else records one event under every rule */
export async function spend(rules: Rule[], message: string): Promise<void> {
  if (!(await take(rules))) throw new ActionError({ code: 'TOO_MANY_REQUESTS', message });
}
