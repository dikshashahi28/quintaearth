/**
 * Insights page: filter by industry and UN goal, reveal the list in pages of 24. The choice is kept in
 * the address (?industry=energy&goal=7) so a filtered list can be shared. Without JS every card shows.
 * The goal options are recounted for the chosen industry: a goal with nothing in it is disabled, not hidden,
 * so the list never reaches nothing without saying why, and the empty note offers a way back.
 */
const PAGE = 24;

export function initInsightFilters(): void {
  const bar = document.getElementById('filters');
  const list = document.getElementById('insightList');
  const select = document.getElementById('goalFilter') as HTMLSelectElement | null;
  const count = document.getElementById('resultCount');
  const none = document.getElementById('noResults');
  const clear = document.getElementById('clearFilters');
  const more = document.getElementById('showMore') as HTMLButtonElement | null;
  if (!bar || !list || !select || !count || !none || !clear || !more) return;

  const slots = [...list.querySelectorAll<HTMLElement>('.card-slot')];
  const buttons = [...bar.querySelectorAll<HTMLButtonElement>('[data-industry]')];
  const options = [...select.options].filter((o) => o.value);
  const params = new URLSearchParams(location.search);
  let industry = params.get('industry') ?? '';
  let goal = params.get('goal') ?? '';
  let shown = PAGE;
  if (!buttons.some((b) => b.dataset.industry === industry)) industry = '';
  if (!options.some((o) => o.value === goal)) goal = '';
  select.value = goal;
  bar.hidden = false;

  const inIndustry = (s: HTMLElement) => !industry || s.dataset.industry === industry;
  const hasGoal = (s: HTMLElement, n: string) => s.dataset.goals?.includes(` ${n} `) ?? false;

  const apply = (keepShown = false) => {
    if (!keepShown) shown = PAGE;
    const matches = slots.filter((s) => inIndustry(s) && (!goal || hasGoal(s, goal)));
    const visible = new Set(matches.slice(0, shown));
    for (const s of slots) s.hidden = !visible.has(s);
    for (const b of buttons) {
      const on = b.dataset.industry === industry;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    }
    // each goal shows how many of the chosen industry's Insights it has; one with none cannot be picked
    for (const o of options) {
      const n = slots.filter((s) => inIndustry(s) && hasGoal(s, o.value)).length;
      o.textContent = `${o.dataset.label} (${n})`;
      o.disabled = n === 0;
    }
    count.textContent = `${matches.length} ${matches.length === 1 ? 'Insight' : 'Insights'}`;
    none.hidden = matches.length > 0;
    more.hidden = matches.length <= shown;
    more.textContent = `Show more (${matches.length - Math.min(shown, matches.length)} left)`;
    const q = new URLSearchParams();
    if (industry) q.set('industry', industry);
    if (goal) q.set('goal', goal);
    history.replaceState(null, '', `${location.pathname}${q.size ? `?${q}` : ''}${location.hash}`);
  };

  for (const b of buttons) b.addEventListener('click', () => { industry = b.dataset.industry ?? ''; apply(); });
  select.addEventListener('change', () => { goal = select.value; apply(); });
  clear.addEventListener('click', (e) => {
    e.preventDefault();
    industry = '';
    goal = '';
    select.value = '';
    apply();
    // the link goes away with the empty note, so focus moves to the "All" industry chip it has just pressed
    buttons.find((b) => b.dataset.industry === '')?.focus();
  });
  more.addEventListener('click', () => {
    const firstNew = shown;
    shown += PAGE;
    apply(true);
    // move focus to the first newly shown card so keyboard users continue where the list grew
    slots.filter((s) => !s.hidden)[firstNew]?.querySelector<HTMLAnchorElement>('h3 a')?.focus();
  });
  apply();
}
