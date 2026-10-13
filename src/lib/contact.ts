// Phone numbers and email addresses are never public (12 Oct): people reach members through enquiries.
// Saves refuse public text that carries one (validate.ts publicText); `scrub` also blanks any that reached the
// database before that rule, wherever member text is shown publicly or indexed for search.
// A phone number is 10 to 15 digits in a run of digits, spaces, dots, dashes and brackets (8 or more after a "+"),
// so years, sizes, lot numbers and standards ("ISO 9001") pass.
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
const PHONE_RUN = /(?<![\p{L}\p{N}.,/])\+?\d[\d ().\-\u00a0]{6,}\d(?![\p{L}\p{N}])/gu;
const isPhone = (run: string) => {
  const digits = run.replace(/\D/g, '').length;
  return digits <= 15 && (digits >= 10 || (run.startsWith('+') && digits >= 8));
};

export function contactIn(text: string): 'email' | 'phone' | null {
  if (new RegExp(EMAIL.source).test(text)) return 'email';
  for (const m of text.matchAll(PHONE_RUN)) if (isPhone(m[0])) return 'phone';
  return null;
}

export const HIDDEN_CONTACT = '[contact hidden]';

/** the text with any email address or phone number replaced; null stays null */
export function scrub<T extends string | null | undefined>(text: T): T {
  if (!text) return text;
  return text.replace(EMAIL, HIDDEN_CONTACT).replace(PHONE_RUN, (m) => (isPhone(m) ? HIDDEN_CONTACT : m)) as T;
}
