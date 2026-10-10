// Company pages (/companies/[slug]) and their team.
import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { env } from 'cloudflare:workers';
import { db, schema } from '../db/client';
import { sendMail, noticeMail } from '../lib/email';
import { requireMember, requireUser } from '../lib/guards';
import { freeHandle } from '../lib/handles';
import { reindexCompany } from '../lib/search';
import { deleteFile, putFile } from '../lib/storage';
import { setTags } from '../lib/tags';
import { hashToken, newToken } from '../lib/tokens';
import { DAY, spend } from '../lib/throttle';
import { checkbox, industriesField, optCountry, optText, optUrl, reqText, sdgsField, subsField, uniq } from '../lib/validate';

const orgId = z.uuid();
const INVITE_DAYS = 7;

async function owners(organizationId: string) {
  return db.select({ userId: schema.members.userId }).from(schema.members)
    .where(and(eq(schema.members.organizationId, organizationId), eq(schema.members.role, 'owner')));
}

export const company = {
  /** a member can start another company page; they become its owner */
  create: defineAction({
    accept: 'form',
    input: z.object({ name: reqText(2, 120, 'Enter the company name.') }),
    handler: async ({ name }, ctx) => {
      const user = requireUser(ctx);
      // a double-clicked "Create" posts twice: the same name from the same owner within a minute is one company
      const findTwin = async () => (await db.select({ id: schema.organizations.id, slug: schema.organizations.slug }).from(schema.organizations)
        .innerJoin(schema.members, eq(schema.members.organizationId, schema.organizations.id))
        .where(and(eq(schema.members.userId, user.id), eq(schema.members.role, 'owner'), eq(schema.organizations.name, name),
          gt(schema.organizations.createdAt, new Date(Date.now() - 60_000)))).limit(1))[0];
      const twin = await findTwin();
      if (twin) return twin;
      const id = crypto.randomUUID();
      const slug = await freeHandle(name, async (s) => !!(await db.query.organizations.findFirst({ where: eq(schema.organizations.slug, s), columns: { id: true } })));
      const create = (s: string) => db.batch([
        db.insert(schema.organizations).values({ id, slug: s, name }),
        db.insert(schema.members).values({ organizationId: id, userId: user.id, role: 'owner' }),
      ]);
      // another request can take the free slug between the check and the insert: a twin answers with itself,
      // anyone else's company only shares the slug, so this one gets a suffix
      if (await create(slug).then(() => true, () => false)) return { id, slug };
      const raced = await findTwin();
      if (raced) return raced;
      const other = `${slug}-${crypto.randomUUID().slice(0, 6)}`;
      await create(other);
      return { id, slug: other };
    },
  }),

  update: defineAction({
    accept: 'form',
    input: z.object({
      organizationId: orgId,
      name: reqText(2, 120, 'Enter the company name.'),
      description: optText(1500),
      city: optText(80),
      country: optCountry,
      size: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+']).or(z.literal('')).nullish().transform((v) => v || null),
      // the year is read per request: on Workers, module-scope code sees the clock at 1970
      foundedYear: z.string().trim().nullish().transform((v, c) => {
        if (!v) return null;
        const n = /^\d{4}$/.test(v) ? Number(v) : NaN;
        if (!Number.isInteger(n) || n < 1800 || n > new Date().getUTCFullYear()) { c.addIssue({ code: 'custom', message: 'Enter a real year.' }); return z.NEVER; }
        return n;
      }),
      website: optUrl,
      linkedin: optUrl,
      industries: industriesField,
      subs: subsField,
      sdgs: sdgsField,
      published: checkbox,
    }),
    handler: async (input, ctx) => {
      await requireMember(ctx, input.organizationId);
      const id = input.organizationId;
      // "Identity checked" vouches for the name that was checked: a new name needs a new check
      const before = await db.query.organizations.findFirst({ where: eq(schema.organizations.id, id), columns: { name: true, identityCheckedAt: true } });
      const renamed = !!before?.identityCheckedAt && before.name !== input.name;
      await db.batch([
        db.update(schema.organizations).set({
          ...(renamed ? { identityCheckedAt: null } : {}),
          name: input.name, description: input.description, city: input.city, country: input.country, size: input.size,
          foundedYear: input.foundedYear, website: input.website, linkedin: input.linkedin, published: input.published, updatedAt: new Date(),
        }).where(eq(schema.organizations.id, id)),
        ...setTags('organization', id, 'industry', uniq(input.industries)),
        ...setTags('organization', id, 'sub', uniq(input.subs)),
        ...setTags('organization', id, 'sdg', uniq(input.sdgs)),
      ]);
      await reindexCompany(id);
      return { published: input.published };
    },
  }),

  setLogo: defineAction({
    accept: 'form',
    input: z.object({ organizationId: orgId, logo: z.instanceof(File) }),
    handler: async ({ organizationId, logo }, ctx) => {
      const { user } = await requireMember(ctx, organizationId);
      const org = await db.query.organizations.findFirst({ where: eq(schema.organizations.id, organizationId), columns: { logoKey: true } });
      const key = await putFile(logo, 'logo', { userId: user.id, organizationId });
      await db.update(schema.organizations).set({ logoKey: key, updatedAt: new Date() }).where(eq(schema.organizations.id, organizationId));
      await deleteFile(org?.logoKey);
      return { key };
    },
  }),

  removeLogo: defineAction({
    accept: 'form',
    input: z.object({ organizationId: orgId }),
    handler: async ({ organizationId }, ctx) => {
      await requireMember(ctx, organizationId);
      const org = await db.query.organizations.findFirst({ where: eq(schema.organizations.id, organizationId), columns: { logoKey: true } });
      await db.update(schema.organizations).set({ logoKey: null, updatedAt: new Date() }).where(eq(schema.organizations.id, organizationId));
      await deleteFile(org?.logoKey);
      return { removed: true };
    },
  }),

  /** owners invite by email; the link works for 7 days and only for that address */
  invite: defineAction({
    accept: 'form',
    input: z.object({
      organizationId: orgId,
      email: z.email({ error: 'Enter a valid email address.' }).max(100).transform((e) => e.toLowerCase()),
      role: z.enum(['owner', 'member']).default('member'),
    }),
    handler: async ({ organizationId, email, role }, ctx) => {
      const { user } = await requireMember(ctx, organizationId, { owner: true });
      const org = (await db.query.organizations.findFirst({ where: eq(schema.organizations.id, organizationId), columns: { name: true } }))!;
      const already = await db.select({ id: schema.user.id }).from(schema.members)
        .innerJoin(schema.user, eq(schema.user.id, schema.members.userId))
        .where(and(eq(schema.members.organizationId, organizationId), eq(schema.user.email, email)));
      if (already.length) throw new ActionError({ code: 'CONFLICT', message: 'That person is already on the team.' });
      // invitations are emails sent in the company's name: a daily allowance per inviter, and per address invited
      await spend([
        { key: `invite:${user.id}`, limit: 20, windowMs: DAY },
        { key: `invited:${email}`, limit: 3, windowMs: DAY },
      ], 'Too many invitations today. Try again tomorrow.');

      const token = newToken();
      const values = {
        organizationId, email, role, tokenHash: await hashToken(token), invitedBy: user.id,
        expiresAt: new Date(Date.now() + INVITE_DAYS * 864e5), acceptedAt: null,
      };
      // inviting the same address again replaces the old link
      await db.insert(schema.invites).values({ id: crypto.randomUUID(), ...values })
        .onConflictDoUpdate({ target: [schema.invites.organizationId, schema.invites.email], set: values });
      await sendMail(noticeMail(email, `Join ${org.name} on QuintaEarth`,
        [`${user.name} invited you to help run the ${org.name} page on QuintaEarth.`, `The link works for ${INVITE_DAYS} days.`],
        { label: 'Accept the invitation', url: `${env.SITE_URL}/invite?token=${encodeURIComponent(token)}` }));
      return { email };
    },
  }),

  /** owners cancel a pending invitation; its link stops working */
  revokeInvite: defineAction({
    accept: 'form',
    input: z.object({ organizationId: orgId, email: z.email().max(100).transform((e) => e.toLowerCase()) }),
    handler: async ({ organizationId, email }, ctx) => {
      await requireMember(ctx, organizationId, { owner: true });
      await db.delete(schema.invites).where(and(eq(schema.invites.organizationId, organizationId), eq(schema.invites.email, email), isNull(schema.invites.acceptedAt)));
      return { email };
    },
  }),

  acceptInvite: defineAction({
    accept: 'form',
    input: z.object({ token: z.string().min(20).max(100) }),
    handler: async ({ token }, ctx) => {
      const user = requireUser(ctx);
      const inv = await db.query.invites.findFirst({
        where: and(eq(schema.invites.tokenHash, await hashToken(token)), isNull(schema.invites.acceptedAt), gt(schema.invites.expiresAt, new Date())),
      });
      if (!inv) throw new ActionError({ code: 'NOT_FOUND', message: 'This invitation has expired or was already used.' });
      if (inv.email !== user.email.toLowerCase()) {
        throw new ActionError({ code: 'FORBIDDEN', message: `This invitation is for ${inv.email}. Sign in with that address.` });
      }
      await db.batch([
        db.insert(schema.members).values({ organizationId: inv.organizationId, userId: user.id, role: inv.role }).onConflictDoNothing(),
        db.update(schema.invites).set({ acceptedAt: new Date() }).where(eq(schema.invites.id, inv.id)),
      ]);
      // a new member still passes through /welcome for their name and profile; it sees the team and skips the type question
      return { organizationId: inv.organizationId };
    },
  }),

  /** owners remove anyone; members can remove themselves; a company always keeps one owner */
  removeMember: defineAction({
    accept: 'form',
    input: z.object({ organizationId: orgId, userId: z.string().min(1) }),
    handler: async ({ organizationId, userId }, ctx) => {
      const { user, membership } = await requireMember(ctx, organizationId);
      if (userId !== user.id && membership.role !== 'owner') throw new ActionError({ code: 'FORBIDDEN', message: 'Only owners can remove team members.' });
      const ownerIds = (await owners(organizationId)).map((o) => o.userId);
      if (ownerIds.length === 1 && ownerIds[0] === userId) throw new ActionError({ code: 'CONFLICT', message: 'Make someone else an owner first.' });
      // one statement: the row goes only while another owner remains, so two owners removing each other at once
      // cannot leave the company with none
      const res = await db.run(sql`DELETE FROM members WHERE organization_id = ${organizationId} AND user_id = ${userId}
        AND (role != 'owner' OR (SELECT count(*) FROM members WHERE organization_id = ${organizationId} AND role = 'owner' AND user_id != ${userId}) > 0)`);
      if (!res.meta.changes) throw new ActionError({ code: 'CONFLICT', message: 'Make someone else an owner first.' });
      return { removed: userId };
    },
  }),
};
