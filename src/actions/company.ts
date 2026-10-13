// Company pages (/companies/[slug]) and their team.
import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { env } from 'cloudflare:workers';
import { db, schema } from '../db/client';
import { sendMail, noticeMail } from '../lib/email';
import { requireMember, requireUser } from '../lib/guards';
import { freeHandle } from '../lib/handles';
import { companyListingRows, organizationDoc, searchRows } from '../lib/search';
import { deleteFile, putFile } from '../lib/storage';
import { setTags } from '../lib/tags';
import { hashToken, newToken } from '../lib/tokens';
import { DAY, spend } from '../lib/throttle';
import { checkbox, countriesField, industriesField, optCountry, optLinkedIn, optSocial, optText, optUrl, publicName, publicText, sdgsField, subsField, uniq, entityId } from '../lib/validate';
import { COMPANY_SIZES, type CaseStudy } from '../db/schema/accounts';
import { companyGreenTexts, nextGreenState } from '../lib/green-words';
import { domainOf } from '../lib/identity';
import { auditRow } from '../lib/audit';
import { parseDay } from '../lib/certifications';

const orgId = entityId();
const INVITE_DAYS = 7;
const MAX_CASES = 6;
const MAX_GALLERY = 12;
const MAX_CERTS = 30;
/** <input type="date">: "" is null; anything else must be a real day */
const dayField = z.string().max(20).nullish().transform((v, c) => {
  const d = parseDay(v);
  if (d === 'bad') { c.addIssue({ code: 'custom', message: 'Enter a date.' }); return z.NEVER; }
  return d;
});

async function owners(organizationId: string) {
  return db.select({ userId: schema.members.userId }).from(schema.members)
    .where(and(eq(schema.members.organizationId, organizationId), eq(schema.members.role, 'owner')));
}

export const company = {
  /** a member can start another company page; they become its owner */
  create: defineAction({
    accept: 'form',
    input: z.object({ name: publicName(2, 120, 'Enter the company name.') }),
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
      name: publicName(2, 120, 'Enter the company name.'),
      /** the registered name, only when it differs */
      legalName: publicText(160),
      description: publicText(1500),
      research: publicText(3000),
      city: optText(80),
      country: optCountry,
      /** countries operated in, apart from the head office's */
      operates: countriesField,
      size: z.enum(COMPANY_SIZES).or(z.literal('')).nullish().transform((v) => v || null),
      // the year is read per request: on Workers, module-scope code sees the clock at 1970
      foundedYear: z.string().trim().nullish().transform((v, c) => {
        if (!v) return null;
        const n = /^\d{4}$/.test(v) ? Number(v) : NaN;
        if (!Number.isInteger(n) || n < 1800 || n > new Date().getUTCFullYear()) { c.addIssue({ code: 'custom', message: 'Enter a real year.' }); return z.NEVER; }
        return n;
      }),
      website: optUrl,
      linkedin: optLinkedIn('linkedin.com/company/your-company'),
      youtube: optSocial(['youtube.com', 'youtu.be'], 'YouTube', 'youtube.com/@your-company'),
      x: optSocial(['x.com', 'twitter.com'], 'X', 'x.com/your-company'),
      instagram: optSocial(['instagram.com'], 'Instagram', 'instagram.com/your-company'),
      facebook: optSocial(['facebook.com', 'fb.com'], 'Facebook', 'facebook.com/your-company'),
      // case studies: parallel lists, one entry per row of the editor; empty rows are dropped
      caseTitle: z.array(publicText(120)).max(MAX_CASES).default([]),
      caseClient: z.array(publicText(120)).max(MAX_CASES).default([]),
      caseSummary: z.array(publicText(600)).max(MAX_CASES).default([]),
      industries: industriesField,
      subs: subsField,
      sdgs: sdgsField,
      published: checkbox,
    }),
    handler: async (input, ctx) => {
      const { user, membership } = await requireMember(ctx, input.organizationId);
      const id = input.organizationId;
      const before = (await db.query.organizations.findFirst({ where: eq(schema.organizations.id, id),
        columns: { name: true, legalName: true, website: true, published: true, identityCheckedAt: true, logoKey: true, greenReview: true, greenHash: true } }))!;
      // a public page always carries a logo: the directory card, the head stone and the enquiry form all show it
      if (input.published && !before.logoKey) throw new ActionError({ code: 'BAD_REQUEST', message: 'Add a logo before showing the company page publicly.' });
      // what "Identity checked" vouches for (the name, the legal name, the website people land on) and whether the
      // page is public are the owners' to change; the rest of the page is the whole team's
      const legalName = input.legalName && input.legalName !== input.name ? input.legalName : null;
      if (membership.role !== 'owner' && (before.name !== input.name || (before.website ?? null) !== input.website || before.published !== input.published
        || (before.legalName ?? null) !== legalName)) {
        throw new ActionError({ code: 'FORBIDDEN', message: 'Only owners can change the company name, legal name, website or whether the page is public.' });
      }
      // a new name, legal name or website domain withdraws the check; the dashboard asks for a re-check
      const lapsed = before.identityCheckedAt
        ? before.name !== input.name ? 'name' : (before.legalName ?? null) !== legalName ? 'legal-name' : domainOf(before.website) !== domainOf(input.website) ? 'domain' : null
        : null;
      // a new website domain also undoes the email and website proofs of a request still in review: they proved the old domain
      const domainMoved = domainOf(before.website) !== domainOf(input.website);
      const pendingCheck = domainMoved ? await db.query.identityChecks.findFirst({
        where: and(eq(schema.identityChecks.organizationId, id), eq(schema.identityChecks.status, 'pending')),
        columns: { id: true, emailVerifiedAt: true, siteVerifiedAt: true },
      }) : null;
      const unprove = pendingCheck && (pendingCheck.emailVerifiedAt || pendingCheck.siteVerifiedAt) ? [
        db.update(schema.identityChecks).set({ emailVerifiedAt: null, emailDomain: null, emailCodeHash: null, emailCodeExpiresAt: null, siteVerifiedAt: null, siteMethod: null,
          siteDomain: null, updatedAt: new Date() }).where(and(eq(schema.identityChecks.id, pendingCheck.id), eq(schema.identityChecks.status, 'pending'))),
        auditRow({ organizationId: id, subjectType: 'identity_check', subjectId: pendingCheck.id, actorUserId: user.id, action: 'domain-changed', result: 'info',
          detail: `Website domain changed from ${domainOf(before.website) ?? 'none'} to ${domainOf(input.website) ?? 'none'}: email and website proofs cleared` }),
      ] : [];
      const industries = uniq(input.industries), subs = uniq(input.subs), operates = uniq(input.operates);
      const caseStudies: CaseStudy[] = input.caseTitle.map((title, i) => ({ title: title ?? '', client: input.caseClient[i] ?? null, summary: input.caseSummary[i] ?? null }))
        .filter((c) => c.title || c.client || c.summary).map((c) => ({ ...c, title: c.title || c.client || 'Case study' }));
      // green wording in the description, research or case studies: saved, but those texts are held from the public
      // until an admin approves exactly them
      const green = await nextGreenState({ greenReview: before.greenReview, greenHash: before.greenHash },
        ...companyGreenTexts({ description: input.description, research: input.research, caseStudies }));
      const visible = { name: input.name, published: input.published, greenReview: green.greenReview };
      // the company's search row and its listings' rows (they carry its name and visibility) change in the same batch
      const listingRows = await companyListingRows(id, visible);
      await db.batch([
        db.update(schema.organizations).set({
          ...(lapsed ? { identityCheckedAt: null, identityLapsed: lapsed } : {}),
          name: input.name, legalName, description: input.description, research: input.research, city: input.city, country: input.country, size: input.size,
          foundedYear: input.foundedYear, website: input.website, linkedin: input.linkedin, youtube: input.youtube, xUrl: input.x, instagram: input.instagram,
          facebook: input.facebook, caseStudies: caseStudies.length ? caseStudies : null, published: input.published, ...green, updatedAt: new Date(),
        }).where(eq(schema.organizations.id, id)),
        ...setTags('organization', id, 'industry', industries),
        ...setTags('organization', id, 'sub', subs),
        ...setTags('organization', id, 'sdg', uniq(input.sdgs)),
        ...setTags('organization', id, 'operates', operates),
        ...searchRows('organization', id, organizationDoc({ ...input, legalName, caseStudies, greenReview: green.greenReview }, { industry: industries, sub: subs, operates })),
        ...listingRows,
        ...unprove,
        ...(lapsed ? [auditRow({ organizationId: id, subjectType: 'organization', subjectId: id, actorUserId: user.id, action: 'lapsed', result: 'info',
          detail: `"Identity checked" withdrawn: the ${lapsed === 'legal-name' ? 'legal name' : lapsed === 'domain' ? 'website domain' : 'name'} changed` })] : []),
        ...(green.greenReview === 'pending' && before.greenReview !== 'pending' ? [auditRow({ organizationId: id, subjectType: 'organization', subjectId: id, actorUserId: user.id,
          action: 'green-flagged', result: 'info', detail: green.greenTerms })] : []),
      ]);
      return { published: input.published, review: green.greenReview, lapsed };
    },
  }),

  /** company and product pictures, up to 12; optionally about one of the company's listings */
  addGalleryImage: defineAction({
    accept: 'form',
    input: z.object({ organizationId: orgId, image: z.instanceof(File), caption: publicText(140), listingId: entityId().or(z.literal('')).nullish().transform((v) => v || null) }),
    handler: async ({ organizationId, image, caption, listingId }, ctx) => {
      const { user } = await requireMember(ctx, organizationId);
      if (listingId && !(await db.query.listings.findFirst({ where: and(eq(schema.listings.id, listingId), eq(schema.listings.organizationId, organizationId)), columns: { id: true } }))) {
        throw new ActionError({ code: 'NOT_FOUND', message: 'Listing not found.' });
      }
      const key = await putFile(image, 'gallery', { userId: user.id, organizationId, listingId }, { max: MAX_GALLERY, per: 'organization', message: `A company can show up to ${MAX_GALLERY} pictures.` }, { caption });
      return { key };
    },
  }),

  removeGalleryImage: defineAction({
    accept: 'form',
    input: z.object({ key: z.string().min(1).max(200) }),
    handler: async ({ key }, ctx) => {
      const notFound = () => new ActionError({ code: 'NOT_FOUND', message: 'Picture not found.' });
      const f = await db.query.files.findFirst({ where: eq(schema.files.key, key) });
      if (!f?.organizationId || f.purpose !== 'gallery') throw notFound();
      await requireMember(ctx, f.organizationId).catch(() => { throw notFound(); });
      await deleteFile(key);
      return { removed: key };
    },
  }),

  /** a certification: name, issuer, evidence (a file, a registry link or both), expiry required */
  addCertification: defineAction({
    accept: 'form',
    input: z.object({
      organizationId: orgId,
      name: publicName(2, 120, 'Enter the certification name.'),
      issuer: publicName(2, 120, 'Enter who issued it.'),
      registryUrl: optUrl,
      issuedOn: dayField,
      expiresOn: dayField,
      file: z.instanceof(File).nullish(),
      /** the evidence file starts private; tick to let anyone open it */
      filePublic: checkbox,
    }).superRefine((v, c) => {
      if (!v.expiresOn) c.addIssue({ code: 'custom', path: ['expiresOn'], message: 'Enter the expiry date.' });
      if (v.issuedOn && v.expiresOn && v.issuedOn > v.expiresOn) c.addIssue({ code: 'custom', path: ['expiresOn'], message: 'The expiry date is before the issue date.' });
      if (!v.registryUrl && !(v.file && v.file.size > 0)) c.addIssue({ code: 'custom', path: ['file'], message: 'Add the certificate file or a registry link.' });
    }),
    handler: async (input, ctx) => {
      const { user, membership } = await requireMember(ctx, input.organizationId);
      // only owners decide what the public may open (as in listings.setEvidencePublic): a member's ticked box is refused
      if (input.filePublic && membership.role !== 'owner') throw new ActionError({ code: 'FORBIDDEN', message: 'Only owners can make a certificate file public.' });
      const n = await db.$count(schema.certifications, eq(schema.certifications.organizationId, input.organizationId));
      if (n >= MAX_CERTS) throw new ActionError({ code: 'BAD_REQUEST', message: `A company can list up to ${MAX_CERTS} certifications.` });
      const evidenceKey = input.file && input.file.size > 0 ? await putFile(input.file, 'certificate', { userId: user.id, organizationId: input.organizationId }) : null;
      if (evidenceKey && input.filePublic) await db.update(schema.files).set({ public: true }).where(eq(schema.files.key, evidenceKey));
      const id = crypto.randomUUID();
      try {
        await db.insert(schema.certifications).values({ id, organizationId: input.organizationId, name: input.name, issuer: input.issuer, registryUrl: input.registryUrl,
          evidenceKey, issuedOn: input.issuedOn, expiresOn: input.expiresOn! });
      } catch (e) {
        await deleteFile(evidenceKey);
        throw e;
      }
      return { id };
    },
  }),

  removeCertification: defineAction({
    accept: 'form',
    input: z.object({ certificationId: entityId() }),
    handler: async ({ certificationId }, ctx) => {
      const notFound = () => new ActionError({ code: 'NOT_FOUND', message: 'Certification not found.' });
      const c = await db.query.certifications.findFirst({ where: eq(schema.certifications.id, certificationId) });
      if (!c) throw notFound();
      await requireMember(ctx, c.organizationId).catch(() => { throw notFound(); });
      await db.delete(schema.certifications).where(eq(schema.certifications.id, certificationId));
      await deleteFile(c.evidenceKey);
      return { removed: certificationId };
    },
  }),

  setLogo: defineAction({
    accept: 'form',
    input: z.object({ organizationId: orgId, logo: z.instanceof(File) }),
    handler: async ({ organizationId, logo }, ctx) => {
      // the logo sits next to the "Identity checked" mark: owners only
      const { user } = await requireMember(ctx, organizationId, { owner: true });
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
      await requireMember(ctx, organizationId, { owner: true });
      const org = await db.query.organizations.findFirst({ where: eq(schema.organizations.id, organizationId), columns: { logoKey: true, published: true } });
      if (org?.published) throw new ActionError({ code: 'BAD_REQUEST', message: 'The page is public and needs a logo. Upload another one to replace it, or hide the page first.' });
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
      // the address must be proved (an email link, or a provider that verified it), not just typed into a social account;
      // read from the database: the session cookie caches the user for a few minutes
      const me = await db.query.user.findFirst({ where: eq(schema.user.id, user.id), columns: { emailVerified: true } });
      if (!me?.emailVerified) {
        throw new ActionError({ code: 'FORBIDDEN', message: `Confirm ${inv.email} first: sign in with an email link to that address, then open the invitation again.` });
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
