// D1 binds at most 100 values per statement: run an IN (...) lookup in slices and join the results.
export async function inChunks<T>(ids: string[], run: (slice: string[]) => Promise<T[]>, size = 90): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += size) out.push(...(await run(ids.slice(i, i + size))));
  return out;
}
