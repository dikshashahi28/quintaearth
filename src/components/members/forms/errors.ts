// The text a page shows for a failed action. Our own ActionErrors carry a message written for members;
// anything else (a database or storage failure) gets a plain line instead of its raw text.
import { isInputError } from 'astro:actions';

const KNOWN = new Set(['BAD_REQUEST', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'CONFLICT', 'TOO_MANY_REQUESTS']);
export const OOPS = 'Something went wrong. Try again.';

export function actionErrorMessage(err: { code?: string; message?: string } | null | undefined): string | null {
  if (!err) return null;
  if (isInputError(err)) return 'Check the form and try again.';
  return err.code && KNOWN.has(err.code) && err.message ? err.message : OOPS;
}
