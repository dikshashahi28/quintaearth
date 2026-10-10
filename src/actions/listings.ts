// Products and services on a company page, with photos and evidence files.
import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { and, eq, gt } from 'drizzle-orm';
import { db, schema } from '../db/client';
import { requireMember } from '../lib/guards';
import { freeHandle } from '../lib/handles';
import { reindex, unindex } from '../lib/search';
import { deleteFile, putFile } from '../lib/storage';
import { clearAllTags, setTags } from '../lib/tags';
import { countriesField, optText, optUrl, reqText, subsField, uniq } from '../lib/validate';

const MAX_EVIDENCE = 10;

/** the listing, after checking the caller is on its company's team */
async function ownListing(ctx: Parameters<typeof requireMember>[0], listingId: string) {
  const l = await db.query.listings.findFirst({ where: eq(schema.listings.id, listingId) });
  if (!l) throw new ActionError({ code: 'NOT_FOUND', message: 'Listing not found.' });
  const { user } = await requireMember(ctx, l.organizationId);
  return { listing: l, user };
}

export const listings = {
  /** creates a listing when listingId is empty, otherwise updates it */
  save: defineAction({
    accept: 'form',
    input: z.object({
      organizationId: z.uuid(),
      listingId: z.uuid().or(z.literal('')).nullish().transform((v) => v || null),
      name: reqText(2, 120, 'Enter a name.'),
      kind: z.enum(['product', 'service']),
      description: optText(2000),
      link: optUrl,
      subs: subsField,
      serves: countriesField,
      status: z.enum(['draft', 'published']),
    }),
    handler: async (input, ctx) => {
      await requireMember(ctx, input.organizationId);
      let id = input.listingId;
      const fields = { name: input.name, kind: input.kind, description: input.description, link: input.link, status: input.status, updatedAt: new Date() };
      if (id) {
        const { listing } = await ownListing(ctx, id);
        if (listing.organizationId !== input.organizationId) throw new ActionError({ code: 'FORBIDDEN', message: 'Listing not found.' });
        await db.batch([
          db.update(schema.listings).set(fields).where(eq(schema.listings.id, id)),
          ...setTags('listing', id, 'sub', uniq(input.subs)),
          ...setTags('listing', id, 'serves', uniq(input.serves)),
        ]);
      } else {
        // a double-clicked "Publish" posts twice: the same name from the same company within a minute is one listing
        const findTwin = () => db.query.listings.findFirst({
          where: and(eq(schema.listings.organizationId, input.organizationId), eq(schema.listings.name, input.name), gt(schema.listings.createdAt, new Date(Date.now() - 60_000))),
          columns: { id: true },
        });
        const twin = await findTwin();
        if (twin) return { id: twin.id };
        id = crypto.randomUUID();
        const newId = id;
        const slug = await freeHandle(input.name, async (s) => !!(await db.query.listings.findFirst({
          where: and(eq(schema.listings.organizationId, input.organizationId), eq(schema.listings.slug, s)), columns: { id: true },
        })));
        const create = (s: string) => db.batch([
          db.insert(schema.listings).values({ id: newId, organizationId: input.organizationId, slug: s, ...fields }),
          ...setTags('listing', newId, 'sub', uniq(input.subs)),
          ...setTags('listing', newId, 'serves', uniq(input.serves)),
        ]);
        // another request can take the free slug between the check and the insert: when that request was this
        // same double-click it is the twin, so answer with it; otherwise the name only shares a slug, so add a suffix
        const created = await create(slug).then(() => true, () => false);
        if (!created) {
          const raced = await findTwin();
          if (raced) return { id: raced.id };
          await create(`${slug}-${crypto.randomUUID().slice(0, 6)}`);
        }
      }
      await reindex('listing', id);
      return { id };
    },
  }),

  remove: defineAction({
    accept: 'form',
    input: z.object({ listingId: z.uuid() }),
    handler: async ({ listingId }, ctx) => {
      const { listing } = await ownListing(ctx, listingId);
      const fileKeys = (await db.select({ key: schema.files.key }).from(schema.files).where(eq(schema.files.listingId, listingId))).map((f) => f.key);
      await db.batch([clearAllTags('listing', listingId), db.delete(schema.listings).where(eq(schema.listings.id, listingId))]);
      await unindex('listing', [listingId]);
      for (const key of [...fileKeys, listing.photoKey]) await deleteFile(key);
      return { removed: listingId };
    },
  }),

  setPhoto: defineAction({
    accept: 'form',
    input: z.object({ listingId: z.uuid(), photo: z.instanceof(File) }),
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
    input: z.object({ listingId: z.uuid() }),
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
    input: z.object({ listingId: z.uuid(), file: z.instanceof(File) }),
    handler: async ({ listingId, file }, ctx) => {
      const { listing, user } = await ownListing(ctx, listingId);
      const key = await putFile(file, 'evidence', { userId: user.id, organizationId: listing.organizationId, listingId },
        { max: MAX_EVIDENCE, message: `A listing can have up to ${MAX_EVIDENCE} files.` });
      return { key };
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
