// Public URL names for people and companies: "Asha Rao" -> "asha-rao", "asha-rao-2" if taken.

export function slugify(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
    .replace(/-+$/, '');
}

/** First of base, base-2, base-3 ... that `taken` says is free. */
export async function freeHandle(base: string, taken: (candidate: string) => Promise<boolean>): Promise<string> {
  const root = slugify(base) || 'member';
  for (let n = 1; n < 50; n++) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    if (!(await taken(candidate))) return candidate;
  }
  return `${root}-${crypto.randomUUID().slice(0, 8)}`;
}
