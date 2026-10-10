// What companies show and what buyers send: listings, their files, enquiries.
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { createdAt, updatedAt, user } from './auth';
import { organizations } from './accounts';

/** a product or service on a company page */
export const listings = sqliteTable('listings', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull(),
  name: text('name').notNull(),
  kind: text('kind', { enum: ['product', 'service'] }).notNull().default('product'),
  description: text('description'),
  link: text('link'),
  photoKey: text('photo_key'),
  status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex('listings_org_slug_idx').on(t.organizationId, t.slug)]);

/** uploaded files: photos, logos, listing evidence, identity-check documents */
export const files = sqliteTable('files', {
  key: text('key').primaryKey(),
  ownerUserId: text('owner_user_id').references(() => user.id, { onDelete: 'set null' }),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  listingId: text('listing_id').references(() => listings.id, { onDelete: 'cascade' }),
  purpose: text('purpose', { enum: ['photo', 'logo', 'listing-photo', 'evidence', 'identity'] }).notNull(),
  name: text('name').notNull(),
  contentType: text('content_type').notNull(),
  size: integer('size').notNull(),
  /** public files are served to anyone; private ones (identity documents) only to the owner company and admins */
  public: integer('public', { mode: 'boolean' }).notNull().default(true),
  createdAt: createdAt(),
}, (t) => [index('files_listing_idx').on(t.listingId), index('files_org_idx').on(t.organizationId)]);

/** a buyer's message to a company; replies live in enquiry_messages */
export const enquiries = sqliteTable('enquiries', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  listingId: text('listing_id').references(() => listings.id, { onDelete: 'set null' }),
  fromUserId: text('from_user_id').references(() => user.id, { onDelete: 'set null' }),
  fromName: text('from_name').notNull(),
  fromEmail: text('from_email').notNull(),
  fromCompany: text('from_company'),
  subject: text('subject').notNull(),
  status: text('status', { enum: ['new', 'open', 'closed'] }).notNull().default('new'),
  /** a message the company's team has not opened yet (a new enquiry, or the buyer's latest reply) */
  companyUnread: integer('company_unread', { mode: 'boolean' }).notNull().default(true),
  /** a company reply the buyer has not opened yet */
  buyerUnread: integer('buyer_unread', { mode: 'boolean' }).notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index('enquiries_org_idx').on(t.organizationId, t.status), index('enquiries_from_idx').on(t.fromUserId)]);

export const enquiryMessages = sqliteTable('enquiry_messages', {
  id: text('id').primaryKey(),
  enquiryId: text('enquiry_id').notNull().references(() => enquiries.id, { onDelete: 'cascade' }),
  /** null when the sender was not signed in (first message from a guest) */
  authorUserId: text('author_user_id').references(() => user.id, { onDelete: 'set null' }),
  side: text('side', { enum: ['buyer', 'company'] }).notNull(),
  body: text('body').notNull(),
  createdAt: createdAt(),
}, (t) => [index('enquiry_messages_enquiry_idx').on(t.enquiryId)]);
