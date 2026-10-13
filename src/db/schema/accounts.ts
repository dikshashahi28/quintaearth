// People and companies. Fields follow the list sent to Diksha on 10 Oct 2026; change here when she confirms.
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { createdAt, updatedAt, user } from './auth';

export const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] as const;
export interface CaseStudy { title: string; client: string | null; summary: string | null }

/**
 * Green-wording review (src/lib/green-words.ts): text with words like "eco" or "carbon neutral" is saved but held
 * from the public until an admin approves that exact text (its hash). "none": nothing to review.
 */
export function greenReviewColumns() {
  return {
    greenReview: text('green_review', { enum: ['none', 'pending', 'approved', 'rejected'] }).notNull().default('none'),
    /** the words found, comma separated */
    greenTerms: text('green_terms'),
    /** hash of the reviewed text: an approval holds only while the text is unchanged */
    greenHash: text('green_hash'),
    /** the admin's note when rejected */
    greenReason: text('green_reason'),
  };
}

/** a person's public page: /people/[handle] */
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => user.id, { onDelete: 'cascade' }),
  handle: text('handle').notNull().unique(),
  headline: text('headline'),
  bio: text('bio'),
  city: text('city'),
  /** ISO 3166 alpha-2, from src/data/countries.ts */
  country: text('country'),
  /** storage key of the photo, served at /files/<key> */
  photoKey: text('photo_key'),
  linkedin: text('linkedin'),
  website: text('website'),
  /** current role, e.g. "Head of operations" */
  roleTitle: text('role_title'),
  /** current company as typed; linked to its page through companyOrgId when the member is on that company's team */
  companyName: text('company_name'),
  companyOrgId: text('company_org_id').references(() => organizations.id, { onDelete: 'set null' }),
  /** shown on /people/[handle] and in the directory only when true */
  published: integer('published', { mode: 'boolean' }).notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** a company's public page: /companies/[slug] */
export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  city: text('city'),
  country: text('country'),
  /** the registered name, when it differs from `name`; changing it drops "Identity checked" */
  legalName: text('legal_name'),
  /** `city` and `country` are the head office; countries operated in are `operates` tags */
  size: text('size', { enum: COMPANY_SIZES }),
  foundedYear: integer('founded_year'),
  website: text('website'),
  linkedin: text('linkedin'),
  youtube: text('youtube'),
  xUrl: text('x_url'),
  instagram: text('instagram'),
  facebook: text('facebook'),
  /** the research, data and technology behind the products */
  research: text('research'),
  /** case studies and clients: JSON [{ title, client, summary }] (client names only with the client's permission) */
  caseStudies: text('case_studies', { mode: 'json' }).$type<CaseStudy[]>(),
  logoKey: text('logo_key'),
  published: integer('published', { mode: 'boolean' }).notNull().default(false),
  /** set when an admin approves an identity check; shown as "Identity checked" for a year (src/lib/identity.ts) */
  identityCheckedAt: integer('identity_checked_at', { mode: 'timestamp_ms' }),
  /** why a past "Identity checked" was withdrawn ("name", "legal-name", "domain"): the dashboard asks for a re-check */
  identityLapsed: text('identity_lapsed'),
  ...greenReviewColumns(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** who can edit a company page */
export const members = sqliteTable('members', {
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['owner', 'member'] }).notNull().default('member'),
  createdAt: createdAt(),
}, (t) => [primaryKey({ columns: [t.organizationId, t.userId] }), index('members_user_id_idx').on(t.userId)]);

/** an emailed invitation to join a company page; the token itself is never stored, only its hash */
export const invites = sqliteTable('invites', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role', { enum: ['owner', 'member'] }).notNull().default('member'),
  tokenHash: text('token_hash').notNull().unique(),
  invitedBy: text('invited_by').references(() => user.id, { onDelete: 'set null' }),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  acceptedAt: integer('accepted_at', { mode: 'timestamp_ms' }),
  createdAt: createdAt(),
}, (t) => [uniqueIndex('invites_org_email_idx').on(t.organizationId, t.email)]);

/**
 * Filterable labels on people, companies and listings: industry and sub-category slugs
 * (src/data/industries.ts), SDG numbers (self-declared), skills, countries a listing serves, countries a company
 * operates in, a person's languages, "open to" choices and services, and a listing's free tags.
 */
export const TAG_KINDS = ['industry', 'sub', 'sdg', 'skill', 'serves', 'operates', 'language', 'open', 'service', 'tag'] as const;
export const tags = sqliteTable('tags', {
  entityType: text('entity_type', { enum: ['profile', 'organization', 'listing'] }).notNull(),
  entityId: text('entity_id').notNull(),
  kind: text('kind', { enum: TAG_KINDS }).notNull(),
  value: text('value').notNull(),
}, (t) => [
  primaryKey({ columns: [t.entityType, t.entityId, t.kind, t.value] }),
  index('tags_lookup_idx').on(t.kind, t.value, t.entityType),
]);
