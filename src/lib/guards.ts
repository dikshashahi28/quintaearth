// Who may do what. Every action and private route calls one of these before touching data.
import { ActionError, type ActionAPIContext } from 'astro:actions';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '../db/client';
import type { SessionUser } from './auth';

type Ctx = Pick<ActionAPIContext, 'locals'>;

export function requireUser(ctx: Ctx): SessionUser {
  const user = ctx.locals.user;
  if (!user) throw new ActionError({ code: 'UNAUTHORIZED', message: 'Sign in first.' });
  return user;
}

export function requireAdmin(ctx: Ctx): SessionUser {
  const user = requireUser(ctx);
  if (user.role !== 'admin') throw new ActionError({ code: 'FORBIDDEN', message: 'Admins only.' });
  return user;
}

/** the caller's membership of a company; owners only when `owner` is true */
export async function requireMember(ctx: Ctx, organizationId: string, { owner = false } = {}) {
  const user = requireUser(ctx);
  const membership = await db.query.members.findFirst({
    where: and(eq(schema.members.organizationId, organizationId), eq(schema.members.userId, user.id)),
  });
  // the same answer for "no such company" and "not yours", so ids cannot be probed
  if (!membership || (owner && membership.role !== 'owner')) {
    throw new ActionError({ code: 'FORBIDDEN', message: owner ? 'Only owners of this company can do that.' : 'You are not a member of this company.' });
  }
  return { user, membership };
}

/** non-throwing check for routes (files) that answer with a status instead */
export async function isMember(userId: string, organizationId: string): Promise<boolean> {
  return !!(await db.query.members.findFirst({
    where: and(eq(schema.members.organizationId, organizationId), eq(schema.members.userId, userId)),
    columns: { role: true },
  }));
}
