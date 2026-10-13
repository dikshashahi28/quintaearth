// Email addresses that asked for new Insights by email (the footer form). One row per address; a repeat
// subscription changes nothing. Addresses are kept lowercase so the unique index catches the repeat.
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createdAt } from './auth';

export const newsletterSubscribers = sqliteTable('newsletter_subscribers', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  /** which form the address came from, e.g. "footer" */
  source: text('source').notNull().default('footer'),
  createdAt: createdAt(),
});
