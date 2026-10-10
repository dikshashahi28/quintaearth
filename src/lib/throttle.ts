// A small counter for anything that sends email or checks a secret, kept in D1 (the sign_in_failures table, whose
// rows are just "key, time"). Each rule is a key and how many events it may see in its window; rows older than a
// day are pruned as new ones arrive.
import { and, eq, gt, lt } from 'drizzle-orm';
import { ActionError } from 'astro:actions';
import { db, schema } from '../db/client';

export interface Rule { key: string; limit: number; windowMs: number }
export const HOUR = 60 * 60_000;
export const DAY = 24 * HOUR;

/** how many events each rule has seen inside its window */
async function counts(rules: Rule[]): Promise<number[]> {
  const now = Date.now();
  return Promise.all(rules.map(async ({ key, limit, windowMs }) => (await db.select({ id: schema.signInFailures.id }).from(schema.signInFailures)
    .where(and(eq(schema.signInFailures.key, key), gt(schema.signInFailures.at, new Date(now - windowMs)))).limit(limit)).length));
}

/** throws TOO_MANY_REQUESTS when any rule is at its limit, else records one event under every rule */
export async function spend(rules: Rule[], message: string): Promise<void> {
  const seen = await counts(rules);
  if (rules.some((r, i) => seen[i]! >= r.limit)) throw new ActionError({ code: 'TOO_MANY_REQUESTS', message });
  await record(rules);
}

/** records one event under every rule (for counting failures after the fact) */
export async function record(rules: Rule[]): Promise<void> {
  const at = new Date();
  await db.batch([
    db.insert(schema.signInFailures).values(rules.map(({ key }) => ({ key, at }))),
    db.delete(schema.signInFailures).where(lt(schema.signInFailures.at, new Date(at.getTime() - DAY))),
  ]);
}

/** true when any rule is at its limit, without recording anything */
export async function blocked(rules: Rule[]): Promise<boolean> {
  const seen = await counts(rules);
  return rules.some((r, i) => seen[i]! >= r.limit);
}
