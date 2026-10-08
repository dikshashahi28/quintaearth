/**
 * Insights page: filter by industry and UN goal, reveal the list in pages of 24. The choice is kept in
 * the address (?industry=energy&goal=7) so a filtered list can be shared. Without JS every card shows.
 */
const PAGE = 24;

export function initInsightFilters(): void {
  const bar = document.getElementById('filters');
  const list = document.getElementById('insightList');
  const select = document.getElementById('goalFilter') as HTMLSelectElement | null;
  const count = document.getElementById('resultCount');
  const none = document.getElementById('noResults');
  const more = document.getElementById('showMore') as HTMLButtonElement | null;
  if (!bar || !list || !select || !count || !none || !more) return;

  const slots = [...list.querySelectorAll<HTMLElement>('.card-slot')];
  const buttons = [...bar.querySelectorAll<HTMLButtonElement>('[data-industry]')];
  const params = new URLSearchParams(location.search);
  let industry = params.get('industry') ?? '';
  let goal = params.get('goal') ?? '';
  let shown = PAGE;
  if (!buttons.some((b) => b.dataset.industry === industry)) industry = '';
  if (![...select.options].some((o) => o.value === goal)) goal = '';
  select.value = goal;
  bar.hidden = false;

  const apply = (keepShown = false) => {
    if (!keepShown) shown = PAGE;
    const matches = slots.filter((s) => (!industry || s.dataset.industry === industry) && (!goal || s.dataset.goals?.includes(` ${goal} `)));
    const visible = new Set(matches.slice(0, shown));
    for (const s of slots) s.hidden = !visible.has(s);
    for (const b of buttons) {
      const on = b.dataset.industry === industry;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
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
  more.addEventListener('click', () => {
    const firstNew = shown;
    shown += PAGE;
    apply(true);
    // move focus to the first newly shown card so keyboard users continue where the list grew
    slots.filter((s) => !s.hidden)[firstNew]?.querySelector<HTMLAnchorElement>('h3 a')?.focus();
  });
  apply();
}
