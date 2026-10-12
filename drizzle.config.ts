// `pnpm db:generate` writes SQL migrations to migrations/; wrangler applies them to D1.
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/db/schema/index.ts',
  out: './migrations',
});
