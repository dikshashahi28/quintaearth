// Volunteer form. Fields, rules, messages and the JSON body are ported unchanged from the old
// js/quinta.js. The résumé is checked (PDF or Word, required) but, as before, never read or sent.
import { countries, type Country } from '../data/countries';
import { formEndpoints } from '../data/site';
import { collapse, hasLetter, isEmail, isMeaningfulText, isPersonName, postToSheet } from '../lib/forms';

export interface VolunteerFields {
  name: string;
  gender: string;
  /** digits only, without the country code */
  phone: string;
  email: string;
  designation: string;
  education: string;
  city: string;
  college: string;
  why: string;
  consent: boolean;
}
type Key = keyof VolunteerFields | 'resume';
export type VolunteerErrors = Partial<Record<Key, string>>;

export interface VolunteerPayload extends Omit<VolunteerFields, 'phone'> {
  /** "+" + dial code + digits, e.g. "+919876543210" */
  phone: string;
}

const IDS: Record<Key, string> = {
  name: 'volunteer-name',
  gender: 'volunteer-gender',
  phone: 'volunteer-phone',
  email: 'volunteer-email',
  designation: 'volunteer-designation',
  education: 'volunteer-education',
  city: 'volunteer-city',
  college: 'volunteer-college',
  resume: 'volunteer-resume',
  why: 'volunteer-why',
  consent: 'volunteer-consent',
};
const ORDER = Object.keys(IDS) as Key[];
const RESUME_ERROR = 'Please attach a PDF or Word file.';
const INDIA: Country = { iso: 'IN', name: 'India', dial: '91' };


export const isResumeFile = (fileName: string) => /\.(pdf|doc|docx)$/i.test(fileName);

export function phoneError(digits: string, dial: string): string {
  if (!digits) return 'Enter a phone number.';
  if (dial === '91') {
    if (digits.length !== 10) return 'Enter a 10-digit Indian mobile number.';
    if (!/^[6-9]/.test(digits)) return 'Enter a valid Indian mobile number.';
  } else if (digits.length < 6 || digits.length > 12) {
    return 'Enter a valid phone number.';
  }
  return '';
}

export function normalizeVolunteer(raw: VolunteerFields): VolunteerFields {
  return {
    name: collapse(raw.name),
    gender: raw.gender,
    phone: raw.phone.replace(/\D/g, ''),
    email: collapse(raw.email).toLowerCase(),
    designation: collapse(raw.designation),
    education: collapse(raw.education),
    city: collapse(raw.city),
    college: collapse(raw.college),
    why: collapse(raw.why),
    consent: raw.consent,
  };
}

/** Errors for normalised values. `resumeName` is the chosen file's name, or "" when none. */
export function validateVolunteer(v: VolunteerFields, dial: string, resumeName: string): VolunteerErrors {
  const e: VolunteerErrors = {};
  const text = (k: 'designation' | 'education' | 'city' | 'college', empty: string, junk: string) => {
    if (!v[k]) e[k] = empty;
    else if (!isMeaningfulText(v[k], 2, 80)) e[k] = junk;
  };

  if (!v.name) e.name = 'Enter your name.';
  else if (!isPersonName(v.name)) e.name = 'Use letters and spaces only.';

  if (!v.gender) e.gender = 'Choose a gender.';

  const phone = phoneError(v.phone, dial);
  if (phone) e.phone = phone;

  if (!v.email) e.email = 'Enter your email.';
  else if (!isEmail(v.email)) e.email = 'Enter a valid email.';

  text('designation', 'Enter your designation.', 'Enter a real designation.');
  text('education', 'Enter your education.', 'Enter a real education value.');
  text('city', 'Enter your city.', 'Enter a real city name.');
  text('college', 'Enter your college.', 'Enter a real college name.');

  if (!resumeName || !isResumeFile(resumeName)) e.resume = RESUME_ERROR;

  if (!v.why) e.why = 'Tell us why you want to volunteer.';
  else if (v.why.length < 20) e.why = 'Please write at least 20 characters.';
  else if (v.why.length > 400) e.why = 'Keep this to 400 characters.';
  else if (!hasLetter(v.why)) e.why = 'Please write a short reason.';

  if (!v.consent) e.consent = 'Please confirm this is a volunteer signup.';
  return e;
}

/** The exact JSON body the old form sent. */
export function volunteerPayload(v: VolunteerFields, dial: string): VolunteerPayload {
  return {
    name: v.name,
    gender: v.gender,
    phone: `+${dial}${v.phone}`,
    email: v.email,
    designation: v.designation,
    education: v.education,
    city: v.city,
    college: v.college,
    why: v.why,
    consent: v.consent,
  };
}

/** The old picker matched the query against "Name +dial ISO +dial". */
export function matchCountries(query: string, list: readonly Country[] = countries): Country[] {
  const q = collapse(query).toLowerCase();
  if (!q) return [...list];
  return list.filter((c) => `${c.name} +${c.dial} ${c.iso} +${c.dial}`.toLowerCase().includes(q));
}

export function flagEmoji(iso: string): string {
  if (!/^[A-Za-z]{2}$/.test(iso)) return '';
  const up = iso.toUpperCase();
  return String.fromCodePoint(0x1f1e6 + up.charCodeAt(0) - 65, 0x1f1e6 + up.charCodeAt(1) - 65);
}

function setError(id: string, message: string): void {
  const field = document.getElementById(id);
  const err = document.getElementById(`${id}-error`);
  if (err) err.textContent = message;
  if (!field) return;
  if (message) field.setAttribute('aria-invalid', 'true');
  else field.removeAttribute('aria-invalid');
}

export function initVolunteerForm(): void {
  const form = document.getElementById('volunteer-form');
  const thanks = document.getElementById('volunteer-thanks');
  const status = document.getElementById('volunteer-status');
  const ccBtn = document.getElementById('volunteer-cc-btn');
  const ccFlag = document.getElementById('volunteer-cc-flag');
  const ccDial = document.getElementById('volunteer-cc-dial');
  const panel = document.getElementById('volunteer-cc-panel');
  const search = document.getElementById('volunteer-cc-search');
  const list = document.getElementById('volunteer-cc-list');
  if (!(form instanceof HTMLFormElement) || !thanks || !status || !ccBtn || !ccFlag || !ccDial || !panel || !(search instanceof HTMLInputElement) || !list) return;
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const el = (k: Key) => form.elements.namedItem(k) as HTMLInputElement;
  const phone = el('phone');
  const resume = el('resume');

  // ---- country code picker: a button that opens a searchable list of countries ----
  let country: Country = countries[0] ?? INDIA;
  const setCountry = (c: Country) => {
    country = c;
    ccFlag.textContent = flagEmoji(c.iso);
    ccDial.textContent = `+${c.dial}`;
    ccBtn.setAttribute('aria-label', `Country code, ${c.name} plus ${c.dial}`);
  };
  const options = () => [...list.querySelectorAll<HTMLButtonElement>('button')];
  const close = () => {
    panel.hidden = true;
    ccBtn.setAttribute('aria-expanded', 'false');
  };

  const render = (query: string) => {
    list.replaceChildren();
    const matches = matchCountries(query);
    if (!matches.length) {
      const li = document.createElement('li');
      li.className = 'cc-empty';
      li.textContent = 'No countries match.';
      list.append(li);
      return;
    }
    for (const c of matches) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      if (c.iso === country.iso) b.setAttribute('aria-current', 'true');
      const flag = document.createElement('span');
      flag.setAttribute('aria-hidden', 'true');
      flag.textContent = flagEmoji(c.iso);
      const name = document.createElement('span');
      name.textContent = c.name;
      const dial = document.createElement('span');
      dial.className = 'dial';
      dial.textContent = `+${c.dial}`;
      b.append(flag, name, dial);
      b.addEventListener('click', () => {
        setCountry(c);
        close();
        phone.focus();
      });
      li.append(b);
      list.append(li);
    }
    list.querySelector('[aria-current]')?.scrollIntoView({ block: 'nearest' });
  };

  const open = () => {
    panel.hidden = false;
    ccBtn.setAttribute('aria-expanded', 'true');
    search.value = '';
    render('');
    search.focus();
  };

  setCountry(country);
  ccBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (panel.hidden) open();
    else close();
  });
  search.addEventListener('input', () => render(search.value));
  // arrows move between the search box and the countries; Escape closes and returns to the button
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      ccBtn.focus();
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const opts = options();
    if (!opts.length) return;
    e.preventDefault();
    const i = opts.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'ArrowDown') opts[Math.min(i + 1, opts.length - 1)]?.focus();
    else if (i <= 0) search.focus();
    else opts[i - 1]?.focus();
  });
  document.addEventListener('click', (e) => {
    if (panel.hidden) return;
    const t = e.target as Node;
    if (panel.contains(t) || ccBtn.contains(t)) return;
    close();
  });
  panel.addEventListener('focusout', (e) => {
    const next = e.relatedTarget as Node | null;
    if (next && !panel.contains(next) && next !== ccBtn) close();
  });

  // ---- phone: digits only, at most 12 ----
  phone.addEventListener('input', () => {
    const digits = phone.value.replace(/\D/g, '').slice(0, 12);
    if (phone.value !== digits) phone.value = digits;
  });
  phone.addEventListener('keydown', (e) => {
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && /\D/.test(e.key)) e.preventDefault();
  });

  // ---- résumé: a wrong file type is cleared at once ----
  const resumeName = () => resume.files?.[0]?.name ?? '';
  resume.addEventListener('change', () => {
    const name = resumeName();
    if (!name || !isResumeFile(name)) {
      resume.value = '';
      setError(IDS.resume, RESUME_ERROR);
    } else {
      setError(IDS.resume, '');
    }
  });

  form.addEventListener('input', (e) => {
    const t = e.target as HTMLElement;
    if (t !== resume && t.id && t.getAttribute('aria-invalid') === 'true') setError(t.id, '');
  });

  const setStatus = (text: string, bad = false) => {
    status.textContent = text;
    status.classList.toggle('bad', bad);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    close();
    setStatus('');
    const values = normalizeVolunteer({
      name: el('name').value,
      gender: el('gender').value,
      phone: phone.value,
      email: el('email').value,
      designation: el('designation').value,
      education: el('education').value,
      city: el('city').value,
      college: el('college').value,
      why: el('why').value,
      consent: el('consent').checked,
    });
    for (const k of ['name', 'phone', 'email', 'designation', 'education', 'city', 'college', 'why'] as const) el(k).value = values[k];

    const errors = validateVolunteer(values, country.dial, resumeName());
    for (const k of ORDER) setError(IDS[k], errors[k] ?? '');
    const first = ORDER.find((k) => errors[k]);
    if (first) {
      document.getElementById(IDS[first])?.focus();
      return;
    }

    setStatus('Sending…');
    if (submit) submit.disabled = true;
    try {
      const res = await postToSheet(formEndpoints.volunteer, volunteerPayload(values, country.dial));
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
