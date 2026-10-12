// The footer's "new Insights by email" form. Anyone may post; nothing is emailed, so the throttle only keeps a
// script from filling the table. An address already on the list gets the same answer as a new one.
import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { db, schema } from '../db/client';
import { HOUR, spend } from '../lib/throttle';

export const newsletter = {
  subscribe: defineAction({
    accept: 'form',
    input: z.object({
      email: z.email({ error: 'Enter a valid email address.' }).max(100).transform((v) => v.toLowerCase()),
      // filled only by bots: the form hides it from people
      website: z.string().max(0).nullish(),
    }),
    handler: async ({ email }, ctx) => {
      const ip = ctx.request.headers.get('cf-connecting-ip');
      await spend([
        { key: `news:${email}`, limit: 5, windowMs: HOUR },
        ...(ip ? [{ key: `news-ip:${ip}`, limit: 20, windowMs: HOUR }] : []),
      ], 'Too many tries. Please try again in an hour.');
      // a repeat is silent: the unique index on email turns the insert into a no-op
      await db.insert(schema.newsletterSubscribers).values({ id: crypto.randomUUID(), email, source: 'footer' }).onConflictDoNothing();
      return { email };
    },
  }),
};
