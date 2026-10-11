// A team invitation, looked up by its token: the invitation page names the company with it, and sign-in and
// sign-up name it too when they are on the way to /invite?token=… (their ?next=), so a new invitee keeps the thread.
import { and, eq, gt, isNull } from 'drizzle-orm';
import { db, schema } from '../../../db/client';
import { hashToken } from '../../../lib/tokens';

export interface Invitation { email: string; company: string }

/** a pending invitation (not accepted, not expired), or undefined */
export async function invitation(token: string): Promise<Invitation | undefined> {
  if (token.length < 20 || token.length > 100) return undefined;
  return (await db.select({ email: schema.invites.email, company: schema.organizations.name })
    .from(schema.invites).innerJoin(schema.organizations, eq(schema.organizations.id, schema.invites.organizationId))
    .where(and(eq(schema.invites.tokenHash, await hashToken(token)), isNull(schema.invites.acceptedAt), gt(schema.invites.expiresAt, new Date()))).limit(1))[0];
}

/** the invitation a ?next= address leads to, if it is /invite?token=… */
export async function invitationFromNext(next: string): Promise<Invitation | undefined> {
  if (!next.startsWith('/invite?')) return undefined;
  return invitation(new URLSearchParams(next.slice('/invite?'.length)).get('token') ?? '');
}
