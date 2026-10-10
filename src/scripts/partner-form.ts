// Partner form on the contact page. Fields, rules, messages and the JSON body are ported unchanged
// from the old js/partner.js, which posted to the Apps Script behind the partner (or collaborators) sheet.
import { formEndpoints } from '../data/site';
import { collapse, hasLetter, isEmail, isMeaningfulText, isPersonName, postToSheet } from '../lib/forms';

export interface PartnerFields {
  company: string;
  company_type: string;
  website: string;
  phone: string;
  place: string;
  email: string;
  contact_name: string;
  designation: string;
  purpose: string;
  consent: boolean;
}
type Key = keyof PartnerFields;
export type PartnerErrors = Partial<Record<Key, string>>;

// field -> element id, in the order the old form checked them; the first invalid one gets focus
const IDS: Record<Key, string> = {
  company: 'partner-company',
  company_type: 'partner-type',
  website: 'partner-website',
  phone: 'partner-phone',
  place: 'partner-place',
  email: 'partner-email',
  contact_name: 'partner-contact',
  designation: 'partner-designation',
  purpose: 'partner-purpose',
  consent: 'partner-consent',
};
const ORDER = Object.keys(IDS) as Key[];


function normalizeWebsite(raw: string): string {
  const s = collapse(raw);
  if (!s) return '';
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

function isHttpUrl(s: string): boolean {
  try {
    const u = new URL(s);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    return host.includes('.') && /[a-z]/i.test(host) && !/\s/.test(s);
  } catch {
    return false;
  }
}

/** Trim and tidy what was typed, as the old form did before checking it. */
export function normalizePartner(raw: PartnerFields): PartnerFields {
  return {
    company: collapse(raw.company),
    company_type: raw.company_type,
    website: normalizeWebsite(raw.website),
    phone: raw.phone.replace(/\D/g, ''),
    place: collapse(raw.place),
    email: collapse(raw.email).toLowerCase(),
    contact_name: collapse(raw.contact_name),
    designation: collapse(raw.designation),
    purpose: collapse(raw.purpose),
    consent: raw.consent,
  };
}

/** Errors for normalised values; an empty object means the form can be sent. */
export function validatePartner(v: PartnerFields): PartnerErrors {
  const e: PartnerErrors = {};
  const text = (k: 'company' | 'place' | 'designation', empty: string, junk: string, min: number, max: number) => {
    if (!v[k]) e[k] = empty;
    else if (!isMeaningfulText(v[k], min, max)) e[k] = junk;
  };

  text('company', 'Enter your company name.', 'Enter a real company name.', 2, 120);
  if (!v.company_type) e.company_type = 'Choose a company type.';

  if (!v.website) e.website = 'Enter your website.';
  else if (!isHttpUrl(v.website)) e.website = 'Enter a valid http(s) URL.';

  if (!v.phone) e.phone = 'Enter a phone number.';
  else if (v.phone.length < 6 || v.phone.length > 12) e.phone = 'Enter a valid phone number.';

  text('place', 'Enter your place.', 'Enter a real place name.', 2, 80);

  if (!v.email) e.email = 'Enter your email.';
  else if (!isEmail(v.email)) e.email = 'Enter a valid email.';

  if (!v.contact_name) e.contact_name = "Enter the contact person's name.";
  else if (!isPersonName(v.contact_name)) e.contact_name = 'Use letters and spaces only.';

  text('designation', 'Enter your designation.', 'Enter a real designation.', 2, 80);

  const p = v.purpose;
  if (!p) e.purpose = 'Tell us the purpose of this partnership.';
  else if (p.length < 20) e.purpose = 'Please write at least 20 characters.';
  else if (p.length > 400) e.purpose = 'Keep this to 400 characters.';
  else if (!hasLetter(p)) e.purpose = 'Please write a short purpose.';
  else if (!isMeaningfulText(p, 20, 400)) e.purpose = 'Please write a real purpose.';

  if (!v.consent) e.consent = 'Please agree to be contacted about this partnership.';
  return e;
}

/** The exact JSON body the old form sent. */
export function partnerPayload(v: PartnerFields): PartnerFields {
  return {
    company: v.company,
    company_type: v.company_type,
    website: v.website,
    phone: v.phone,
    place: v.place,
    email: v.email,
    contact_name: v.contact_name,
    designation: v.designation,
    purpose: v.purpose,
    consent: v.consent,
  };
}

/** The old dialog wrote to the collaborators sheet when opened from the collaborators band; links now say so with ?source=collaborators. */
export function partnerEndpoint(search: string): string {
  return new URLSearchParams(search).get('source') === 'collaborators' ? formEndpoints.collaborators : formEndpoints.partner;
}

function setError(id: string, message: string): void {
  const field = document.getElementById(id);
  const err = document.getElementById(`${id}-error`);
  if (err) err.textContent = message;
  if (!field) return;
  if (message) field.setAttribute('aria-invalid', 'true');
  else field.removeAttribute('aria-invalid');
}

/** Phone boxes take digits only, at most 12. */
function digitsOnly(input: HTMLInputElement): void {
  input.addEventListener('input', () => {
    const digits = input.value.replace(/\D/g, '').slice(0, 12);
    if (input.value !== digits) input.value = digits;
  });
  input.addEventListener('keydown', (e) => {
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && /\D/.test(e.key)) e.preventDefault();
  });
}

export function initPartnerForm(): void {
  const form = document.getElementById('partner-form');
  const thanks = document.getElementById('partner-thanks');
  const status = document.getElementById('partner-status');
  if (!(form instanceof HTMLFormElement) || !thanks || !status) return;
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const endpoint = partnerEndpoint(location.search);
  const el = (k: Key) => form.elements.namedItem(k) as HTMLInputElement;

  digitsOnly(el('phone'));
  // an edited field drops its error at once; the full check runs again on submit
  form.addEventListener('input', (e) => {
    const t = e.target as HTMLElement;
    if (t.id && t.getAttribute('aria-invalid') === 'true') setError(t.id, '');
  });

  const setStatus = (text: string, bad = false) => {
    status.textContent = text;
    status.classList.toggle('bad', bad);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const values = normalizePartner({
      company: el('company').value,
      company_type: el('company_type').value,
      website: el('website').value,
      phone: el('phone').value,
      place: el('place').value,
      email: el('email').value,
      contact_name: el('contact_name').value,
      designation: el('designation').value,
      purpose: el('purpose').value,
      consent: el('consent').checked,
    });
    // show the tidied values, as the old form did
    for (const k of ORDER) if (k !== 'consent' && k !== 'company_type') el(k).value = values[k];

    const errors = validatePartner(values);
    for (const k of ORDER) setError(IDS[k], errors[k] ?? '');
    const first = ORDER.find((k) => errors[k]);
    if (first) {
      setStatus('');
      document.getElementById(IDS[first])?.focus();
      return;
    }

    setStatus('Sending…');
    if (submit) submit.disabled = true;
    try {
      const res = await postToSheet(endpoint, partnerPayload(values));
      if (!res.ok) throw new Error('submit failed');
      setStatus('');
      form.hidden = true;
      thanks.hidden = false;
      thanks.focus();
    } catch {
      setStatus('Something went wrong. Please try again.', true);
    } finally {
      if (submit) submit.disabled = false;
    }
  });
}
