// The few Worker types the server code needs, taken from @cloudflare/workers-types as modules.
// Loading that package's full runtime globals would clash with the DOM types the site's browser scripts use.
// Bindings and secrets (Cloudflare.Env) are generated into worker-configuration.d.ts by `pnpm types`.
type D1Database = import('@cloudflare/workers-types/index').D1Database;
type D1Result<T = unknown> = import('@cloudflare/workers-types/index').D1Result<T>;
type Fetcher = import('@cloudflare/workers-types/index').Fetcher;
type R2Bucket = import('@cloudflare/workers-types/index').R2Bucket;

declare module 'cloudflare:workers' {
  export const env: Cloudflare.Env;
}
