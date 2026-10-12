// Uploads post their own forms, so a reload would drop unsaved edits in the page's main form.
// With JS, a dirty main form is saved first (same action, as a background post); only then is the upload sent.
// If that save fails, the main form is submitted normally so its errors show. Without JS nothing changes.

/** The text fields of a form's data, in order. Files are left out: they are never part of the main form. */
export function snapshot(data: FormData): string {
  const pairs: [string, string][] = [];
  data.forEach((v, k) => { if (typeof v === 'string') pairs.push([k, v]); });
  return JSON.stringify(pairs);
}

export function isDirty(initial: string, data: FormData): boolean {
  return snapshot(data) !== initial;
}

/** `main`: the details form. `others`: forms that reload the page (uploads, removals). */
export function saveFirst(main: HTMLFormElement, others: Iterable<HTMLFormElement>): void {
  let initial = snapshot(new FormData(main));
  let busy = false;
  for (const form of others) {
    form.addEventListener('submit', async (e) => {
      if (busy) { e.preventDefault(); return; }
      if (!isDirty(initial, new FormData(main))) return;
      e.preventDefault();
      // the browser's own messages for a field the main form would reject
      if (!main.checkValidity()) { main.reportValidity(); return; }
      busy = true;
      const buttons = form.querySelectorAll<HTMLButtonElement>('button');
      buttons.forEach((b) => { b.disabled = true; });
      let ok = false;
      try {
        const res = await fetch(main.action, { method: 'POST', body: new FormData(main), headers: { Accept: 'application/json' } });
        ok = res.ok;
      } catch { ok = false; }
      if (ok) {
        initial = snapshot(new FormData(main));
        form.submit();
      } else {
        busy = false;
        buttons.forEach((b) => { b.disabled = false; });
        main.requestSubmit();
      }
    });
  }
}
