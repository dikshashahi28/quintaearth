// "Identity checked": a company asks, an admin reviews. It says who they are, never that they are green.
import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { createdAt, updatedAt, user } from './auth';
import { organizations } from './accounts';

export const identityChecks = sqliteTable('identity_checks', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  requestedBy: text('requested_by').references(() => user.id, { onDelete: 'set null' }),
  /** company registration number (CIN, KvK, Companies House ...) */
  registrationNumber: text('registration_number').notNull(),
  registrationCountry: text('registration_country').notNull(),
  /** a work email on the company's own domain, to compare with the website */
  workEmail: text('work_email').notNull(),
  note: text('note'),
  /** the private registration document sent with this request, if any (a key in `files`) */
  documentKey: text('document_key'),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  reviewedBy: text('reviewed_by').references(() => user.id, { onDelete: 'set null' }),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp_ms' }),
  /** shown to the company when rejected */
  reason: text('reason'),
  // the fixed checklist (src/lib/identity.ts). Registration and the short call are ticked by an admin; the business
  // email and website ownership are proved by the company (a code sent to the address; a DNS TXT record or meta tag)
  registrationCheckedAt: integer('registration_checked_at', { mode: 'timestamp_ms' }),
  registrationCheckedBy: text('registration_checked_by').references(() => user.id, { onDelete: 'set null' }),
  /** a short call, only for edge cases (no public registry, a free email domain); stands in for the missing items */
  callDoneAt: integer('call_done_at', { mode: 'timestamp_ms' }),
  callDoneBy: text('call_done_by').references(() => user.id, { onDelete: 'set null' }),
  /** SHA-256 of the 6-digit code sent to workEmail, its expiry and the wrong tries so far */
  emailCodeHash: text('email_code_hash'),
  emailCodeExpiresAt: integer('email_code_expires_at', { mode: 'timestamp_ms' }),
  emailCodeTries: integer('email_code_tries').notNull().default(0),
  emailVerifiedAt: integer('email_verified_at', { mode: 'timestamp_ms' }),
  /** the domain of the address the code proved; the tick counts only while it is on the website's domain */
  emailDomain: text('email_domain'),
  /** the value to publish as a TXT record or a <meta name="quintaearth-verify"> tag */
  siteToken: text('site_token'),
  siteVerifiedAt: integer('site_verified_at', { mode: 'timestamp_ms' }),
  siteMethod: text('site_method', { enum: ['dns', 'meta'] }),
  /** the domain the TXT record or meta tag was found on; the tick counts only while the website is on it */
  siteDomain: text('site_domain'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index('identity_checks_status_idx').on(t.status, t.createdAt), index('identity_checks_org_idx').on(t.organizationId),
  // one pending request per company (migrations/0004_identity_one_pending.sql)
  uniqueIndex('identity_checks_one_pending_idx').on(t.organizationId).where(sql`status = 'pending'`)]);

/**
 * Who checked what, when, with what result: every identity-check step and every green-wording decision. Rows are
 * only ever added. Admins read it on /admin/audit.
 */
export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').references(() => organizations.id, { onDelete: 'set null' }),
  /** what was checked: a company, a listing or an identity check */
  subjectType: text('subject_type', { enum: ['organization', 'listing', 'identity_check', 'profile'] }).notNull(),
  subjectId: text('subject_id').notNull(),
  actorUserId: text('actor_user_id').references(() => user.id, { onDelete: 'set null' }),
  /** e.g. "registration", "email-code-sent", "email", "website", "call", "approved", "rejected", "lapsed", "green-approved" */
  action: text('action').notNull(),
  result: text('result', { enum: ['pass', 'fail', 'info'] }).notNull(),
  detail: text('detail'),
  createdAt: createdAt(),
}, (t) => [index('audit_log_org_idx').on(t.organizationId, t.createdAt), index('audit_log_subject_idx').on(t.subjectType, t.subjectId)]);
