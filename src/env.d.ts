/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user: import('./lib/auth').SessionUser | null;
    session: import('./lib/auth').Session | null;
  }
}
