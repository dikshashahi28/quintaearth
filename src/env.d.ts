/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user: import('./lib/auth').SessionUser | null;
    session: import('./lib/auth').Session | null;
  }
}

interface ImportMetaEnv {
  /** "dev" for the dev.quintaearth.com build: no indexing */
  readonly PUBLIC_DEPLOY?: string;
}
