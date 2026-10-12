// Partner form on the contact page. Fields, rules, messages and the JSON body are ported unchanged
// from the old js/partner.js, which posted to the Apps Script behind the partner (or collaborators) sheet.
// The page carries the form on the spring's river rail: a bead per step (`.qe-rail[data-for="id id"]`) that
// lights when every field it names passes these same rules, the send bead (`data-for="*"`) when all of them do.
import { serviceNames } from '../data/services';
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

// field -> element id, in the order the fields sit on the page; the first invalid one gets focus (the JSON body
// keeps the old key order in partnerPayload)
const IDS: Record<Key, string> = {
  company: 'partner-company',
  company_type: 'partner-type',
  website: 'partner-website',
  place: 'partner-place',
  contact_name: 'partner-contact',
  designation: 'partner-designation',
  email: 'partner-email',
  phone: 'partner-phone',
  purpose: 'partner-purpose',
  consent: 'partner-consent',
};
const ORDER = Object.keys(IDS) as Key[];
const KEY_OF = Object.fromEntries(ORDER.map((k) => [IDS[k], k])) as Record<string, Key>;


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

/**
 * Errors for normalised values; an empty object means the form can be sent. `purposePrefix` is the text the page
 * put in Purpose itself ("Proposal for: …"), which does not count towards the 20 characters the sender must write.
 */
export function validatePartner(v: PartnerFields, purposePrefix = '', proposal = false): PartnerErrors {
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
  if (!p) e.purpose = proposal ? 'Tell us what you need a proposal for.' : 'Tell us the purpose of this partnership.';
  else if (p.length < 20) e.purpose = 'Please write at least 20 characters.';
  else if (p.length > 400) e.purpose = 'Keep this to 400 characters.';
  else if (!hasLetter(p)) e.purpose = 'Please write a short purpose.';
  else if (!isMeaningfulText(p, 20, 400)) e.purpose = 'Please write a real purpose.';
  else if (purposePrefix && p.startsWith(purposePrefix) && p.slice(purposePrefix.length).trim().length < 20) e.purpose = 'Please write at least 20 characters.';

  if (!v.consent) e.consent = proposal ? 'Please agree to be contacted about this proposal.' : 'Please agree to be contacted about this partnership.';
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

/**
 * /services links here with ?offer=<slug>: the form head reads "Ask for a proposal", names the offer, and the
 * purpose starts with it (?offer=any names no offer). Returns the text put into Purpose, tidied the way the
 * values are, so the submit check can leave it out of the 20-character count.
 */
export function nameOffer(search: string): { proposal: boolean; prefix: string } {
  const offer = new URLSearchParams(search).get('offer') ?? '';
  const name = serviceNames[offer];
  if (!name && offer !== 'any') return { proposal: false, prefix: '' };
  const title = document.getElementById('partner-title');
  const sub = document.getElementById('partner-sub');
  const consent = document.getElementById('partner-consent-text');
  const purpose = document.getElementById('partner-purpose');
  if (title) title.textContent = 'Ask for a proposal';
  if (sub) sub.textContent = `${name ? `${name}. ` : ''}Tell us about your company and what you make, and we will send a written proposal.`;
  if (consent) consent.textContent = 'I agree to be contacted about this proposal.';
  if (!name) return { proposal: true, prefix: '' };
  const prefix = `Proposal for: ${name}.`;
  if (purpose instanceof HTMLTextAreaElement && !purpose.value) purpose.value = `${prefix} `;
  return { proposal: true, prefix };
}

/** The old dialog wrote to the collaborators sheet when opened from the collaborators band; links now say so with ?source=collaborators. */
export function partnerEndpoint(search: string): string {
  return new URLSearchParams(search).get('source') === 'collaborators' ? formEndpoints.collaborators : formEndpoints.partner;
}

/**
 * The river rail beside the form: each rail names the fields of its step (data-for="id id"); its bead lights
 * (and its track fills) when they all pass the form's rules, so a bead never lights beside a value the form would
 * reject. "data-for='*'" is the send step, lit when the whole form is. Nothing is lit without the script.
 */
function lightBeads(form: HTMLFormElement, read: () => PartnerFields, purposePrefix: string, proposal: boolean): () => void {
  const rails = [...form.querySelectorAll<HTMLElement>('.qe-rail[data-for]')];
  if (!rails.length) return () => {};
  return () => {
    const errors = validatePartner(normalizePartner(read()), purposePrefix, proposal);
    for (const rail of rails) {
      const ids = rail.dataset.for!.split(/\s+/).filter(Boolean);
      const ok = ids[0] === '*' ? Object.keys(errors).length === 0 : ids.every((id) => KEY_OF[id] !== undefined && !errors[KEY_OF[id]!]);
      rail.classList.toggle('lit', ok);
      rail.classList.toggle('on', ok);
    }
  };
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
  const { proposal, prefix: purposePrefix } = nameOffer(location.search);
  const el = (k: Key) => form.elements.namedItem(k) as HTMLInputElement;
  const read = (): PartnerFields => ({
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

  digitsOnly(el('phone'));
  const light = lightBeads(form, read, purposePrefix, proposal);
  form.addEventListener('input', light);
  form.addEventListener('change', light);
  light();
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
    const values = normalizePartner(read());
    // show the tidied values, as the old form did
    for (const k of ORDER) if (k !== 'consent' && k !== 'company_type') el(k).value = values[k];

    const errors = validatePartner(values, purposePrefix, proposal);
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
