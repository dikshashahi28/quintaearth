// Shared by the partner, volunteer and review forms: the text checks the old site used, and the POST to
// the Google Apps Script web apps behind Diksha's sheets.

export const collapse = (s: unknown): string => String(s ?? '').replace(/\s+/g, ' ').trim();
export const hasLetter = (s: string): boolean => /\p{L}/u.test(s);
export const isPersonName = (s: string): boolean => s.length >= 2 && s.length <= 80 && /^\p{L}+(?: \p{L}+)*$/u.test(s);
export const isEmail = (s: string): boolean => s.length <= 100 && /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,24}$/.test(s);

/** Between min and max characters, has a letter, and is not one character repeated ("aaaa"). */
export function isMeaningfulText(s: string, min: number, max: number): boolean {
  if (s.length < min || s.length > max || !hasLetter(s)) return false;
  const compact = s.replace(/\s/g, '');
  return compact.length >= 2 && !/^(.)\1+$/.test(compact);
}

/**
 * POST a JSON body to an Apps Script web app. The body is JSON but sent as text/plain: an
 * application/json request triggers a CORS preflight that Apps Script never answers, so browsers
 * blocked every submission on the old site. doPost still reads the same string from e.postData.contents.
 */
export function postToSheet(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  });
}
