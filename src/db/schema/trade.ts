// What companies show and what buyers send: listings, their files, enquiries.
import { sql } from 'drizzle-orm';
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { createdAt, updatedAt, user } from './auth';
import { greenReviewColumns, organizations } from './accounts';

export const FILE_PURPOSES = ['photo', 'logo', 'listing-photo', 'evidence', 'identity', 'certificate', 'gallery'] as const;

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
  /** how it is priced; prices themselves are never shown */
  pricingModel: text('pricing_model', { enum: ['quote', 'fixed', 'subscription'] }),
  /** lead time or availability, short text ("4 to 6 weeks", "In stock") */
  leadTime: text('lead_time'),
  /** specifications, searchable */
  specs: text('specs'),
  status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
  ...greenReviewColumns(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex('listings_org_slug_idx').on(t.organizationId, t.slug), index('listings_green_idx').on(t.greenReview)]);

/**
 * A company's certification: one source of truth that its listings link to. Evidence is an uploaded file
 * (`evidenceKey`, a key in `files`), a registry link, or both. Expiry is required; an expired one is shown as
 * expired, decided when the page is read (src/lib/certifications.ts), never stored.
 */
export const certifications = sqliteTable('certifications', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  issuer: text('issuer').notNull(),
  evidenceKey: text('evidence_key'),
  registryUrl: text('registry_url'),
  issuedOn: integer('issued_on', { mode: 'timestamp_ms' }),
  expiresOn: integer('expires_on', { mode: 'timestamp_ms' }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index('certifications_org_idx').on(t.organizationId), index('certifications_evidence_key_idx').on(t.evidenceKey).where(sql`evidence_key is not null`)]);

/** which of the company's certifications a listing claims */
export const listingCertifications = sqliteTable('listing_certifications', {
  listingId: text('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  certificationId: text('certification_id').notNull().references(() => certifications.id, { onDelete: 'cascade' }),
}, (t) => [primaryKey({ columns: [t.listingId, t.certificationId] }), index('listing_certifications_cert_idx').on(t.certificationId)]);

/** uploaded files: photos, logos, listing evidence, certificates, the company gallery, identity-check documents */
export const files = sqliteTable('files', {
  key: text('key').primaryKey(),
  ownerUserId: text('owner_user_id').references(() => user.id, { onDelete: 'set null' }),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  listingId: text('listing_id').references(() => listings.id, { onDelete: 'cascade' }),
  purpose: text('purpose', { enum: FILE_PURPOSES }).notNull(),
  name: text('name').notNull(),
  contentType: text('content_type').notNull(),
  size: integer('size').notNull(),
  /**
   * public files are served to anyone while the page showing them is public, else to its editors; private ones only
   * to the company's team and admins. Evidence and certificates start private; the owner can make each one public.
   * Identity documents are never public.
   */
  public: integer('public', { mode: 'boolean' }).notNull().default(true),
  /** gallery pictures: a short caption */
  caption: text('caption'),
  createdAt: createdAt(),
}, (t) => [index('files_listing_idx').on(t.listingId), index('files_org_idx').on(t.organizationId), index('files_owner_idx').on(t.ownerUserId)]);

/**
 * A message to a company (organizationId) or to a person (toUserId): exactly one is set. Replies live in
 * enquiry_messages. The receiving side is called "company" in the columns for both.
 */
export const enquiries = sqliteTable('enquiries', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  toUserId: text('to_user_id').references(() => user.id, { onDelete: 'cascade' }),
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
}, (t) => [index('enquiries_org_idx').on(t.organizationId, t.status), index('enquiries_from_idx').on(t.fromUserId), index('enquiries_to_user_idx').on(t.toUserId, t.status), index('enquiries_listing_idx').on(t.listingId), index('enquiries_org_updated_idx').on(t.organizationId, t.updatedAt), index('enquiries_to_updated_idx').on(t.toUserId, t.updatedAt), index('enquiries_from_updated_idx').on(t.fromUserId, t.updatedAt)]);

export const enquiryMessages = sqliteTable('enquiry_messages', {
  id: text('id').primaryKey(),
  enquiryId: text('enquiry_id').notNull().references(() => enquiries.id, { onDelete: 'cascade' }),
  /** null when the sender was not signed in (first message from a guest) */
  authorUserId: text('author_user_id').references(() => user.id, { onDelete: 'set null' }),
  side: text('side', { enum: ['buyer', 'company'] }).notNull(),
  body: text('body').notNull(),
  createdAt: createdAt(),
}, (t) => [index('enquiry_messages_enquiry_idx').on(t.enquiryId), index('enquiry_messages_author_idx').on(t.authorUserId)]);
