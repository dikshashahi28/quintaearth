// Testimonials: reads reviews from the Apps Script sheet and, when a Google client id is configured,
// runs the review form ported from the old js/reviews.js (Google Sign-In, same rules, same JSON body).
// Reviewers' email addresses are stored with the review but never shown on the page.
import { formEndpoints } from '../data/site';
import { collapse, isMeaningfulText, isPersonName, postToSheet } from '../lib/forms';

export interface ReviewRow {
  timestamp?: string;
  name?: string;
  designation?: string;
  company?: string;
  rating?: string | number;
  review?: string;
  email?: string;
  source?: string;
}

export interface ReviewFields {
  name: string;
  designation: string;
  company: string;
  rating: string;
  review: string;
}
type Key = keyof ReviewFields;
export type ReviewErrors = Partial<Record<Key, string>>;

export interface ReviewPayload extends ReviewFields {
  email: string;
  source: string;
}

interface Session { email: string; name: string }

interface GoogleId {
  initialize(options: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
    auto_select?: boolean;
    ux_mode?: 'popup' | 'redirect';
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, string>): void;
  disableAutoSelect?(): void;
}
declare global {
  interface Window { google?: { accounts?: { id?: GoogleId } } }
}

const STAR = 'M12 2.7l2.35 7.23h7.6l-6.15 4.47 2.35 7.23L12 17.16l-6.15 4.47 2.35-7.23-6.15-4.47h7.6z';
const SESSION_KEY = 'qe-review-google';
const IDS: Record<Key, string> = {
  name: 'review-name',
  designation: 'review-designation',
  company: 'review-company',
  rating: 'review-rating',
  review: 'review-text',
};
const ORDER = Object.keys(IDS) as Key[];

// the Google session email is checked loosely, as the old code did
const isSessionEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

// ---------- reading and showing reviews ----------

/** Rows with a name and a review, newest first; smoke-test rows from the backend checks are dropped. */
export function usableReviews(rows: unknown): ReviewRow[] {
  if (!Array.isArray(rows)) return [];
  return (rows as (ReviewRow | null)[])
    .filter((r): r is ReviewRow => !!r && !!collapse(r.review) && !!collapse(r.name) && collapse(r.source).toLowerCase() !== 'smoke-test')
    .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
}

/** 1 to 5; anything unreadable counts as 5, as before. */
export function starCount(rating: ReviewRow['rating']): number {
  const n = parseInt(String(rating ?? ''), 10) || 5;
  return Math.max(1, Math.min(5, n));
}

export function roleLine(row: ReviewRow): string {
  return [collapse(row.designation), collapse(row.company)].filter(Boolean).join(' · ');
}

function stars(count: number): HTMLElement {
  const p = document.createElement('p');
  p.className = 'stars';
  p.setAttribute('role', 'img');
  p.setAttribute('aria-label', `${count} out of 5 stars`);
  for (let i = 0; i < 5; i++) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    if (i < count) svg.classList.add('on');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', STAR);
    svg.append(path);
    p.append(svg);
  }
  return p;
}

/** One card: stars, quote, name, role and company. The email is deliberately not read. */
function card(row: ReviewRow): HTMLLIElement {
  const li = document.createElement('li');
  const article = document.createElement('article');
  article.className = 'review';
  const quote = document.createElement('blockquote');
  const text = document.createElement('p');
  text.textContent = collapse(row.review);
  quote.append(text);
  const who = document.createElement('footer');
  const name = document.createElement('p');
  name.className = 'name';
  name.textContent = collapse(row.name);
  who.append(name);
  const role = roleLine(row);
  if (role) {
    const r = document.createElement('p');
    r.className = 'role';
    r.textContent = role;
    who.append(r);
  }
  article.append(stars(starCount(row.rating)), quote, who);
  li.append(article);
  return li;
}

export async function loadReviews(): Promise<void> {
  const box = document.getElementById('reviews');
  const list = document.getElementById('reviews-list');
  const note = document.getElementById('reviews-note');
  if (!box || !list || !note) return;
  box.setAttribute('aria-busy', 'true');
  try {
    const res = await fetch(formEndpoints.reviews, { method: 'GET', redirect: 'follow' });
    if (!res.ok) throw new Error('get failed');
    const data = (await res.json()) as { reviews?: unknown };
    const reviews = usableReviews(data?.reviews);
    list.replaceChildren(...reviews.map(card));
    list.hidden = !reviews.length;
    note.hidden = reviews.length > 0;
    note.textContent = 'No reviews yet.';
  } catch {
    list.hidden = !list.children.length;
    note.hidden = !list.hidden;
    note.textContent = 'Reviews could not load right now.';
  } finally {
    box.removeAttribute('aria-busy');
  }
}

// ---------- the review form ----------

export function normalizeReview(raw: ReviewFields): ReviewFields {
  return {
    name: collapse(raw.name),
    designation: collapse(raw.designation),
    company: collapse(raw.company),
    rating: raw.rating,
    review: collapse(raw.review),
  };
}

export function validateReview(v: ReviewFields): ReviewErrors {
  const e: ReviewErrors = {};
  if (!v.name) e.name = 'Enter your name.';
  else if (!isPersonName(v.name)) e.name = 'Use letters and spaces only.';

  if (!v.designation) e.designation = 'Enter your designation or role.';
  else if (!isMeaningfulText(v.designation, 2, 80)) e.designation = 'Enter a real designation or role.';

  if (v.company && !isMeaningfulText(v.company, 2, 80)) e.company = 'Enter a real company or place, or leave this blank.';

  if (!/^[1-5]$/.test(v.rating)) e.rating = 'Choose a star rating.';

  const r = v.review;
  if (!r) e.review = 'Write a short review.';
  else if (r.length < 20) e.review = 'Please write at least 20 characters.';
  else if (r.length > 400) e.review = 'Keep this to 400 characters.';
  else if (!isMeaningfulText(r, 20, 400)) e.review = 'Please write a real review.';
  return e;
}

/** The old form tagged reviews by the page they came from. */
export function reviewSource(pathname: string): string {
  const file = (pathname.split('/').pop() || '').toLowerCase();
  return file === 'testimonials.html' || file === 'testimonials' ? 'testimonials' : 'homepage';
}

/** The exact JSON body the old form sent. */
export function reviewPayload(v: ReviewFields, email: string, source: string): ReviewPayload {
  return {
    name: v.name,
    designation: v.designation,
    company: v.company,
    rating: v.rating,
    review: v.review,
    email,
    source,
  };
}

/** Reads the profile out of a Google ID token (no signature check; the old page did the same). */
export function decodeCredential(credential: string): { email?: string; name?: string; given_name?: string } | null {
  try {
    const part = credential.split('.')[1];
    if (!part) return null;
    const bin = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    // the token is UTF-8; atob alone would garble non-Latin names
    return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
  } catch {
    return null;
  }
}

function readSession(): Session | null {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null') as Partial<Session> | null;
    if (!parsed || !isSessionEmail(collapse(parsed.email))) return null;
    return { email: collapse(parsed.email), name: collapse(parsed.name) };
  } catch {
    return null;
  }
}

function writeSession(session: Session | null): void {
  try {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // storage blocked: the sign-in simply lasts until the page closes
  }
}

function setError(id: string, message: string): void {
  const field = document.getElementById(id);
  const err = document.getElementById(`${id}-error`);
  if (err) err.textContent = message;
  if (!field) return;
  if (message) field.setAttribute('aria-invalid', 'true');
  else field.removeAttribute('aria-invalid');
}

export function initReviewForm(clientId: string): void {
  const form = document.getElementById('review-form');
  const auth = document.getElementById('review-auth');
  const authError = document.getElementById('review-auth-error');
  const googleBtn = document.getElementById('review-google-btn');
  const fallback = document.getElementById('review-google-fallback');
  const signed = document.getElementById('review-signed');
  const signedEmail = document.getElementById('review-signed-email');
  const signOut = document.getElementById('review-signout');
  const count = document.getElementById('review-count');
  const status = document.getElementById('review-status');
  const thanks = document.getElementById('review-thanks');
  if (!(form instanceof HTMLFormElement) || !auth || !authError || !googleBtn || !fallback || !signed || !signedEmail || !signOut || !count || !status || !thanks) return;
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const el = (k: Exclude<Key, 'rating'>) => form.elements.namedItem(k) as HTMLInputElement;
  const rating = () => form.querySelector<HTMLInputElement>('input[name="rating"]:checked')?.value ?? '';
  let session: Session | null = null;

  const setAuthError = (text: string) => {
    authError.textContent = text;
    authError.hidden = !text;
  };
  const setStatus = (text: string, bad = false) => {
    status.textContent = text;
    status.classList.toggle('bad', bad);
  };
  const syncCount = () => {
    count.textContent = `${el('review').value.length} / 400`;
  };
  const clearErrors = () => ORDER.forEach((k) => setError(IDS[k], ''));

  const showSignedOut = () => {
    session = null;
    writeSession(null);
    auth.hidden = false;
    signed.hidden = true;
    signedEmail.textContent = '';
    form.hidden = true;
    thanks.hidden = true;
  };
  const showSignedIn = (s: Session) => {
    auth.hidden = true;
    signed.hidden = false;
    signedEmail.textContent = s.email;
    form.hidden = false;
    if (!collapse(el('name').value) && isPersonName(s.name)) el('name').value = s.name;
    setAuthError('');
  };
  const setSession = (s: Session | null, focus: boolean) => {
    if (!s || !isSessionEmail(collapse(s.email))) {
      showSignedOut();
      return;
    }
    session = { email: collapse(s.email), name: collapse(s.name) };
    writeSession(session);
    showSignedIn(session);
    if (focus) el('name').focus();
  };

  const renderGoogleButton = () => {
    const gid = window.google?.accounts?.id;
    if (!gid) {
      fallback.hidden = false;
      setAuthError('Google Sign-In could not load. Please refresh.');
      return;
    }
    setAuthError('');
    fallback.hidden = true;
    gid.initialize({
      client_id: clientId,
      callback: (response) => {
        const profile = decodeCredential(response.credential ?? '');
        if (!profile || !isSessionEmail(profile.email ?? '')) {
          setAuthError('Google Sign-In did not return an email. Please try again.');
          return;
        }
        setSession({ email: profile.email ?? '', name: profile.name || profile.given_name || '' }, true);
      },
      auto_select: false,
      ux_mode: 'popup',
    });
    googleBtn.replaceChildren();
    gid.renderButton(googleBtn, { type: 'standard', theme: 'outline', size: 'large', text: 'signin_with', shape: 'rectangular' });
  };
  // the Google script loads async; give it 4 seconds before showing the fallback message
  const waitForGoogle = (attempt = 0) => {
    if (window.google?.accounts?.id || attempt >= 40) renderGoogleButton();
    else window.setTimeout(() => waitForGoogle(attempt + 1), 100);
  };

  fallback.addEventListener('click', () => {
    setAuthError('Google Sign-In is still loading. Please wait a moment.');
    waitForGoogle();
  });
  signOut.addEventListener('click', () => {
    window.google?.accounts?.id?.disableAutoSelect?.();
    form.reset();
    clearErrors();
    syncCount();
    setStatus('');
    showSignedOut();
    renderGoogleButton();
  });

  form.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name === 'review') syncCount();
    if (t.name === 'rating') setError(IDS.rating, '');
    else if (t.id && t.getAttribute('aria-invalid') === 'true') setError(t.id, '');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('');
    if (!session || !isSessionEmail(session.email)) {
      showSignedOut();
      setAuthError('Sign in with Google before leaving a review.');
      return;
    }
    const values = normalizeReview({
      name: el('name').value,
      designation: el('designation').value,
      company: el('company').value,
      rating: rating(),
      review: el('review').value,
    });
    for (const k of ['name', 'designation', 'company', 'review'] as const) el(k).value = values[k];
    syncCount();

    const errors = validateReview(values);
    for (const k of ORDER) setError(IDS[k], errors[k] ?? '');
    const first = ORDER.find((k) => errors[k]);
    if (first) {
      // the rating group takes focus on its first star
      document.getElementById(first === 'rating' ? 'review-star-1' : IDS[first])?.focus();
      return;
    }

    setStatus('Sending…');
    if (submit) submit.disabled = true;
    try {
      const res = await postToSheet(formEndpoints.reviews, reviewPayload(values, session.email, reviewSource(location.pathname)));
      if (!res.ok) throw new Error('submit failed');
      setStatus('');
      form.hidden = true;
      auth.hidden = true;
      signed.hidden = true;
      thanks.hidden = false;
      thanks.focus();
      void loadReviews();
    } catch {
      setStatus('Something went wrong. Your review could not be stored. Please try again.', true);
    } finally {
      if (submit) submit.disabled = false;
    }
  });

  syncCount();
  const stored = readSession();
  if (stored) setSession(stored, false);
  else showSignedOut();
  waitForGoogle();
}

export function initReviews(): void {
  void loadReviews();
  const room = document.getElementById('leave-review');
  const clientId = room?.dataset.clientId?.trim();
  if (clientId) initReviewForm(clientId);
}
