// People and companies. Fields follow the list sent to Diksha on 10 Oct 2026; change here when she confirms.
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { createdAt, updatedAt, user } from './auth';

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
  size: text('size', { enum: ['1-10', '11-50', '51-200', '201-1000', '1000+'] }),
  foundedYear: integer('founded_year'),
  website: text('website'),
  linkedin: text('linkedin'),
  logoKey: text('logo_key'),
  published: integer('published', { mode: 'boolean' }).notNull().default(false),
  /** set when an admin approves an identity check; shown as "Identity checked" */
  identityCheckedAt: integer('identity_checked_at', { mode: 'timestamp_ms' }),
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
 * (src/data/industries.ts), SDG numbers, skills, and countries a listing serves.
 */
export const tags = sqliteTable('tags', {
  entityType: text('entity_type', { enum: ['profile', 'organization', 'listing'] }).notNull(),
  entityId: text('entity_id').notNull(),
  kind: text('kind', { enum: ['industry', 'sub', 'sdg', 'skill', 'serves'] }).notNull(),
  value: text('value').notNull(),
}, (t) => [
  primaryKey({ columns: [t.entityType, t.entityId, t.kind, t.value] }),
  index('tags_lookup_idx').on(t.kind, t.value, t.entityType),
]);
