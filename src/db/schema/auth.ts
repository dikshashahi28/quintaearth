// Tables the login library reads and writes. Keys are the field names it expects (camelCase);
// columns are snake_case. Timestamps are stored as milliseconds.
import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;
const createdAt = () => integer('created_at', { mode: 'timestamp_ms' }).notNull().default(now);
const updatedAt = () => integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(now);

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  /** "individual" or "company"; empty until the member picks one on /welcome */
  accountType: text('account_type', { enum: ['individual', 'company'] }),
  /** "admin" can review identity checks and moderate; set by hand in the database */
  role: text('role', { enum: ['member', 'admin'] }).notNull().default('member'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index('session_user_id_idx').on(t.userId)]);

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp_ms' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp_ms' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index('account_user_id_idx').on(t.userId)]);

/** one-time sign-in links */
export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index('verification_identifier_idx').on(t.identifier)]);

export { createdAt, updatedAt };

/** failed password sign-ins, by "email:<address>" and "ip:<address>"; recent rows slow down guessing */
export const signInFailures = sqliteTable('sign_in_failures', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull(),
  at: integer('at', { mode: 'timestamp_ms' }).notNull().default(now),
}, (t) => [index('sign_in_failures_key_at_idx').on(t.key, t.at)]);
