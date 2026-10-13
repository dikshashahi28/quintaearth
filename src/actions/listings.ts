// Products and services on a company page, with photos and evidence files.
import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { and, eq, gt, inArray } from 'drizzle-orm';
import { db, schema } from '../db/client';
import { isMember, requireMember, requireUser } from '../lib/guards';
import { freeHandle } from '../lib/handles';
import { listingDoc, searchRows } from '../lib/search';
import { deleteFile, putFile } from '../lib/storage';
import { clearAllTags, setTags } from '../lib/tags';
import { countriesField, checkbox, listingTagsField, optUrl, publicName, publicText, subsField, uniq, entityId } from '../lib/validate';
import { listingGreenTexts, nextGreenState } from '../lib/green-words';
import { auditRow } from '../lib/audit';

const MAX_EVIDENCE = 10;

const notFound = () => new ActionError({ code: 'NOT_FOUND', message: 'Listing not found.' });

/** the listing, after checking the caller is on its company's team; "missing" and "not yours" are one answer, so ids cannot be probed */
async function ownListing(ctx: Parameters<typeof requireMember>[0], listingId: string) {
  const user = requireUser(ctx);
  const l = await db.query.listings.findFirst({ where: eq(schema.listings.id, listingId) });
  if (!l || !(await isMember(user.id, l.organizationId))) throw notFound();
  return { listing: l, user };
}

export const listings = {
  /** creates a listing when listingId is empty, otherwise updates it */
  save: defineAction({
    accept: 'form',
    input: z.object({
      organizationId: entityId(),
      listingId: entityId().or(z.literal('')).nullish().transform((v) => v || null),
      name: publicName(2, 120, 'Enter a name.'),
      /** product or service */
      kind: z.enum(['product', 'service']),
      description: publicText(2000),
      link: optUrl,
      /** how it is priced; never a price */
      pricingModel: z.enum(['quote', 'fixed', 'subscription']).or(z.literal('')).nullish().transform((v) => v || null),
      leadTime: publicText(80),
      specs: publicText(3000),
      tags: listingTagsField,
      /** certifications of the company this listing claims */
      certifications: z.array(entityId()).max(30).default([]),
      subs: subsField,
      serves: countriesField,
      status: z.enum(['draft', 'published']),
    }),
    handler: async (input, ctx) => {
      const { user } = await requireMember(ctx, input.organizationId);
      let id = input.listingId;
      const subs = uniq(input.subs), serves = uniq(input.serves), certIds = uniq(input.certifications);
      // a listing links to its own company's certifications only
      if (certIds.length) {
        const owned = await db.select({ id: schema.certifications.id }).from(schema.certifications)
          .where(and(eq(schema.certifications.organizationId, input.organizationId), inArray(schema.certifications.id, certIds)));
        if (owned.length !== certIds.length) throw new ActionError({ code: 'BAD_REQUEST', message: 'Choose certifications from your company’s list.' });
      }
      const prev = id ? (await db.query.listings.findFirst({ where: eq(schema.listings.id, id), columns: { greenReview: true, greenHash: true } })) ?? null : null;
      // green wording: saved, but held from the public until an admin approves exactly this text
      const green = await nextGreenState(prev, ...listingGreenTexts(input));
      const fields = { name: input.name, kind: input.kind, description: input.description, link: input.link, pricingModel: input.pricingModel, leadTime: input.leadTime,
        specs: input.specs, status: input.status, ...green, updatedAt: new Date() };
      // the search row is rewritten in the same batch as the listing, from what is being saved
      const org = (await db.query.organizations.findFirst({ where: eq(schema.organizations.id, input.organizationId), columns: { name: true, published: true, greenReview: true } }))!;
      const doc = listingDoc(fields, org, { sub: subs, serves, tag: input.tags });
      const certRows = (listingId: string) => [
        db.delete(schema.listingCertifications).where(eq(schema.listingCertifications.listingId, listingId)),
        ...(certIds.length ? [db.insert(schema.listingCertifications).values(certIds.map((certificationId) => ({ listingId, certificationId })))] : []),
      ];
      const flagged = (listingId: string) => (green.greenReview === 'pending' && prev?.greenReview !== 'pending'
        ? [auditRow({ organizationId: input.organizationId, subjectType: 'listing', subjectId: listingId, actorUserId: user.id, action: 'green-flagged', result: 'info', detail: green.greenTerms })]
        : []);
      if (id) {
        const { listing } = await ownListing(ctx, id);
        if (listing.organizationId !== input.organizationId) throw notFound();
        const listingId = id;
        await db.batch([
          db.update(schema.listings).set(fields).where(eq(schema.listings.id, listingId)),
          ...setTags('listing', listingId, 'sub', subs),
          ...setTags('listing', listingId, 'serves', serves),
          ...setTags('listing', listingId, 'tag', input.tags),
          ...certRows(listingId),
          ...searchRows('listing', listingId, doc),
          ...flagged(listingId),
        ]);
      } else {
        // a double-clicked "Publish" posts twice: the same name from the same company within a minute is one listing
        const findTwin = () => db.query.listings.findFirst({
          where: and(eq(schema.listings.organizationId, input.organizationId), eq(schema.listings.name, input.name), gt(schema.listings.createdAt, new Date(Date.now() - 60_000))),
          columns: { id: true },
        });
        const twin = await findTwin();
        if (twin) return { id: twin.id, review: green.greenReview };
        id = crypto.randomUUID();
        const newId = id;
        const slug = await freeHandle(input.name, async (s) => !!(await db.query.listings.findFirst({
          where: and(eq(schema.listings.organizationId, input.organizationId), eq(schema.listings.slug, s)), columns: { id: true },
        })));
        const create = (s: string) => db.batch([
          db.insert(schema.listings).values({ id: newId, organizationId: input.organizationId, slug: s, ...fields }),
          ...setTags('listing', newId, 'sub', subs),
          ...setTags('listing', newId, 'serves', serves),
          ...setTags('listing', newId, 'tag', input.tags),
          ...certRows(newId),
          ...searchRows('listing', newId, doc),
          ...flagged(newId),
        ]);
        // another request can take the free slug between the check and the insert: when that request was this
        // same double-click it is the twin, so answer with it; otherwise the name only shares a slug, so add a suffix
        const created = await create(slug).then(() => true, () => false);
        if (!created) {
          const raced = await findTwin();
          if (raced) return { id: raced.id, review: green.greenReview };
          await create(`${slug}-${crypto.randomUUID().slice(0, 6)}`);
        }
      }
      return { id, review: green.greenReview };
    },
  }),

  remove: defineAction({
    accept: 'form',
    input: z.object({ listingId: entityId() }),
    handler: async ({ listingId }, ctx) => {
      const { listing } = await ownListing(ctx, listingId);
      const fileKeys = (await db.select({ key: schema.files.key }).from(schema.files).where(eq(schema.files.listingId, listingId))).map((f) => f.key);
      await db.batch([clearAllTags('listing', listingId), db.delete(schema.listings).where(eq(schema.listings.id, listingId)), ...searchRows('listing', listingId, null)]);
      for (const key of [...fileKeys, listing.photoKey]) await deleteFile(key);
      return { removed: listingId };
    },
  }),

  setPhoto: defineAction({
    accept: 'form',
    input: z.object({ listingId: entityId(), photo: z.instanceof(File) }),
    handler: async ({ listingId, photo }, ctx) => {
      const { listing, user } = await ownListing(ctx, listingId);
      const key = await putFile(photo, 'listing-photo', { userId: user.id, organizationId: listing.organizationId, listingId });
      await db.update(schema.listings).set({ photoKey: key, updatedAt: new Date() }).where(eq(schema.listings.id, listingId));
      await deleteFile(listing.photoKey);
      return { key };
    },
  }),

  removePhoto: defineAction({
    accept: 'form',
    input: z.object({ listingId: entityId() }),
    handler: async ({ listingId }, ctx) => {
      const { listing } = await ownListing(ctx, listingId);
      await db.update(schema.listings).set({ photoKey: null, updatedAt: new Date() }).where(eq(schema.listings.id, listingId));
      await deleteFile(listing.photoKey);
      return { removed: true };
    },
  }),

  /** proof for the listing's claims: certificates, test reports, photos */
  addEvidence: defineAction({
    accept: 'form',
    input: z.object({ listingId: entityId(), file: z.instanceof(File) }),
    handler: async ({ listingId, file }, ctx) => {
      const { listing, user } = await ownListing(ctx, listingId);
      const key = await putFile(file, 'evidence', { userId: user.id, organizationId: listing.organizationId, listingId },
        { max: MAX_EVIDENCE, message: `A listing can have up to ${MAX_EVIDENCE} files.` });
      return { key };
    },
  }),

  /** evidence starts private (team and admins only); the owner can let anyone open a file, or take that back */
  setEvidencePublic: defineAction({
    accept: 'form',
    input: z.object({ key: z.string().min(1).max(200), public: checkbox }),
    handler: async ({ key, public: open }, ctx) => {
      const f = await db.query.files.findFirst({ where: eq(schema.files.key, key) });
      const notFoundFile = () => new ActionError({ code: 'NOT_FOUND', message: 'File not found.' });
      if (!f?.organizationId || (f.purpose !== 'evidence' && f.purpose !== 'certificate')) throw notFoundFile();
      // someone off the team gets the same answer as a missing key; the company's owners decide what the public may open
      const user = requireUser(ctx);
      if (!(await isMember(user.id, f.organizationId))) throw notFoundFile();
      await requireMember(ctx, f.organizationId, { owner: true });
      await db.update(schema.files).set({ public: open }).where(eq(schema.files.key, key));
      return { key, public: open };
    },
  }),

  removeEvidence: defineAction({
    accept: 'form',
    input: z.object({ key: z.string().min(1).max(200) }),
    handler: async ({ key }, ctx) => {
      const f = await db.query.files.findFirst({ where: eq(schema.files.key, key) });
      if (!f?.listingId || f.purpose !== 'evidence') throw new ActionError({ code: 'NOT_FOUND', message: 'File not found.' });
      await ownListing(ctx, f.listingId);
      await deleteFile(key);
      return { removed: key };
    },
  }),
};
