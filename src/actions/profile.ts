// A member's own person page: /people/[handle].
import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/client';
import { requireUser } from '../lib/guards';
import { reindex } from '../lib/search';
import { deleteFile, putFile } from '../lib/storage';
import { setTags } from '../lib/tags';
import { checkbox, industriesField, optCountry, optText, optUrl, reqText, skillsField, subsField, uniq } from '../lib/validate';

async function myProfile(userId: string) {
  const p = await db.query.profiles.findFirst({ where: eq(schema.profiles.userId, userId) });
  if (!p) throw new ActionError({ code: 'NOT_FOUND', message: 'Finish setting up your account first.' });
  return p;
}

export const profile = {
  update: defineAction({
    accept: 'form',
    input: z.object({
      name: reqText(2, 80, 'Enter your name.'),
      headline: optText(120),
      bio: optText(1200),
      city: optText(80),
      country: optCountry,
      linkedin: optUrl,
      website: optUrl,
      industries: industriesField,
      subs: subsField,
      skills: skillsField,
      published: checkbox,
    }),
    handler: async (input, ctx) => {
      const user = requireUser(ctx);
      const p = await myProfile(user.id);
      const now = new Date();
      await db.batch([
        db.update(schema.user).set({ name: input.name, updatedAt: now }).where(eq(schema.user.id, user.id)),
        db.update(schema.profiles).set({
          headline: input.headline, bio: input.bio, city: input.city, country: input.country,
          linkedin: input.linkedin, website: input.website, published: input.published, updatedAt: now,
        }).where(eq(schema.profiles.id, p.id)),
        ...setTags('profile', p.id, 'industry', uniq(input.industries)),
        ...setTags('profile', p.id, 'sub', uniq(input.subs)),
        // person profiles no longer carry UN goals; clear any saved before they were removed
        ...setTags('profile', p.id, 'sdg', []),
        ...setTags('profile', p.id, 'skill', input.skills),
      ]);
      await reindex('profile', p.id);
      return { handle: p.handle, published: input.published };
    },
  }),

  setPhoto: defineAction({
    accept: 'form',
    input: z.object({ photo: z.instanceof(File) }),
    handler: async ({ photo }, ctx) => {
      const user = requireUser(ctx);
      const p = await myProfile(user.id);
      const key = await putFile(photo, 'photo', { userId: user.id });
      await db.update(schema.profiles).set({ photoKey: key, updatedAt: new Date() }).where(eq(schema.profiles.id, p.id));
      await deleteFile(p.photoKey);
      return { key };
    },
  }),

  removePhoto: defineAction({
    accept: 'form',
    handler: async (_, ctx) => {
      const user = requireUser(ctx);
      const p = await myProfile(user.id);
      await db.update(schema.profiles).set({ photoKey: null, updatedAt: new Date() }).where(eq(schema.profiles.id, p.id));
      await deleteFile(p.photoKey);
      return { removed: true };
    },
  }),
};
