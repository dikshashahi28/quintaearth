// A member's own person page: /people/[handle].
import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/client';
import { requireUser } from '../lib/guards';
import { profileDoc, searchRows } from '../lib/search';
import { deleteFile, putFile } from '../lib/storage';
import { setTags } from '../lib/tags';
import { myCompanies } from '../db/queries/dashboard';
import { checkbox, industriesField, languagesField, openToField, optCountry, optLinkedIn, optText, optUrl, publicName, publicText, sdgsField, servicesField,
  skillsField, subsField, uniq } from '../lib/validate';

async function myProfile(userId: string) {
  const p = await db.query.profiles.findFirst({ where: eq(schema.profiles.userId, userId) });
  if (!p) throw new ActionError({ code: 'NOT_FOUND', message: 'Finish setting up your account first.' });
  return p;
}

export const profile = {
  update: defineAction({
    accept: 'form',
    input: z.object({
      name: publicName(2, 80, 'Enter your name.'),
      headline: publicText(120),
      bio: publicText(1200),
      roleTitle: publicText(80),
      companyName: publicText(120),
      /** one of the member's own companies, to link the role to that company's page */
      companyOrgId: z.string().max(60).nullish().transform((v) => v || null),
      city: optText(80),
      country: optCountry,
      linkedin: optLinkedIn('linkedin.com/in/your-name'),
      website: optUrl,
      industries: industriesField,
      subs: subsField,
      skills: skillsField,
      // UN goals come back on people (12 Oct), shown as "Works on (self-declared)"
      sdgs: sdgsField,
      languages: languagesField,
      openTo: openToField,
      services: servicesField,
      published: checkbox,
    }),
    handler: async (input, ctx) => {
      const user = requireUser(ctx);
      const p = await myProfile(user.id);
      const now = new Date();
      const industries = uniq(input.industries), subs = uniq(input.subs);
      // the role links to a company page only when the member is on that company's team (team opt-in): picked from
      // their companies, or typed with the same name as one of them. Anything else stays plain text.
      const mine = await myCompanies(user.id);
      const linked = mine.find((c) => c.id === input.companyOrgId)
        ?? (input.companyName ? mine.find((c) => c.name.toLowerCase() === input.companyName!.toLowerCase()) : undefined);
      const companyName = linked ? linked.name : input.companyName;
      const companyOrgId = linked?.id ?? null;
      // the search row is rewritten in the same batch, from what is being saved
      const doc = profileDoc({ ...input, companyName }, { skill: input.skills, industry: industries, sub: subs, service: input.services, language: input.languages });
      await db.batch([
        db.update(schema.user).set({ name: input.name, updatedAt: now }).where(eq(schema.user.id, user.id)),
        db.update(schema.profiles).set({
          headline: input.headline, bio: input.bio, city: input.city, country: input.country, roleTitle: input.roleTitle, companyName, companyOrgId,
          linkedin: input.linkedin, website: input.website, published: input.published, updatedAt: now,
        }).where(eq(schema.profiles.id, p.id)),
        ...setTags('profile', p.id, 'industry', industries),
        ...setTags('profile', p.id, 'sub', subs),
        ...setTags('profile', p.id, 'sdg', uniq(input.sdgs)),
        ...setTags('profile', p.id, 'skill', input.skills),
        ...setTags('profile', p.id, 'language', input.languages),
        ...setTags('profile', p.id, 'open', uniq(input.openTo)),
        ...setTags('profile', p.id, 'service', input.services),
        ...searchRows('profile', p.id, doc),
      ]);
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
