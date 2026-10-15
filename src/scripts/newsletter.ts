// The footer's "new Insights by email" form: posts through the newsletter action and shows the answer in place.
// Without JavaScript the form posts to /newsletter, which shows the same answer on its own page.
import { actions } from 'astro:actions';
import { actionErrorMessage } from '../components/members/forms/errors';

export function initNewsletter(): void {
  const form = document.getElementById('news-form');
  const status = document.getElementById('news-status');
  const input = document.getElementById('news-email');
  if (!(form instanceof HTMLFormElement) || !status || !(input instanceof HTMLInputElement)) return;
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');

  // one live region, set up before anything is written into it: a role changed in the same tick as the text
  // is missed by screen readers. Every answer, including an error, is read in full as a polite status.
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  status.setAttribute('aria-atomic', 'true');
  const say = (text: string, tone: '' | 'bad' | 'wait' = '') => {
    status.textContent = text;
    status.className = `news-status${tone ? ` ${tone}` : ''}`;
  };
  input.addEventListener('input', () => {
    if (input.getAttribute('aria-invalid') === 'true') { input.removeAttribute('aria-invalid'); say(''); }
    // typing again after a saved subscription: the bead goes back to rest until the next one is saved
    form.classList.remove('lit');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!input.value.trim() || !input.checkValidity()) {
      input.setAttribute('aria-invalid', 'true');
      say('Enter a valid email address.', 'bad');
      input.focus();
      return;
    }
    if (button) button.disabled = true;
    say('Sending…', 'wait');
    try {
      const { data, error } = await actions.newsletter.subscribe(new FormData(form));
      if (data) {
        say(`Thank you. New Insights will come to ${data.email}.`);
        form.reset();
        // the bead lights gold: the river has reached its last stop
        form.classList.add('lit');
      } else {
        const fields = (error as { fields?: Record<string, string[]> }).fields;
        say(fields?.email?.[0] ?? actionErrorMessage(error) ?? 'Something went wrong. Try again.', 'bad');
        input.setAttribute('aria-invalid', 'true');
      }
    } catch {
      say('Something went wrong. Try again.', 'bad');
    } finally {
      if (button) button.disabled = false;
    }
  });
}
