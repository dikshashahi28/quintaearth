// "Identity checked": a company asks, an admin reviews. It says who they are, never that they are green.
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
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
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index('identity_checks_status_idx').on(t.status, t.createdAt), index('identity_checks_org_idx').on(t.organizationId)]);
