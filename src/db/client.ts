// The D1 database bound as DB in wrangler.jsonc. Server-only: import from on-demand pages, actions and middleware.
import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export const db = drizzle(env.DB, { schema });
export type Db = typeof db;
export { schema };
