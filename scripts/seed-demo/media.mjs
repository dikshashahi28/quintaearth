// Photos for the demo community, found on Openverse (CC0, CC BY and CC BY-SA photographs only).
//
//   node scripts/seed-demo/media.mjs search   -> candidates.json: the best few results per slot
//   node scripts/seed-demo/media.mjs sheet    -> contact sheets in sheets/ to pick by eye
//   node scripts/seed-demo/media.mjs fetch    -> media/<slot>.webp from the picks in picks.json, plus CREDITS.json
//
// Slots are the `photo` values of listings in data.mjs, resized to 3:2. People keep the initials stone: the open
// photo libraries have no usable, model-released portraits, and real strangers' faces do not belong on made-up profiles.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const UA = 'QuintaEarthSeed/1.0 (hello@quintaearth.com)';
const file = (n) => join(here, n);
const json = (n) => JSON.parse(readFileSync(file(n), 'utf8'));

// [slot, query, shape]
export const slots = [

  ['solar-school-roof', 'solar panels roof installation', 'wide'],
  ['solar-pump-field', 'solar water pump', 'wide'],
  ['battery-rack', 'battery storage system', 'wide'],
  ['solar-maintenance', 'cleaning solar panels', 'wide'],
  ['denim-yarn', 'yarn spools mill', 'wide'],
  ['workwear-sorting', 'textile recycling sorting', 'wide'],
  ['hemp-fabric', 'hemp fabric', 'wide'],
  ['mangrove-planting', 'mangrove planting', 'wide'],
  ['mangrove-survey', 'mangrove aerial', 'wide'],
  ['mangrove-nursery', 'mangrove nursery seedlings', 'wide'],
  ['hempcrete-wall', 'hempcrete', 'wide'],
  ['timber-frame', 'timber frame construction', 'wide'],
  ['building-audit', 'architect building plans', 'wide'],
  ['electric-van', 'electric delivery van', 'wide'],
  ['route-planning', 'logistics warehouse computer', 'wide'],
  ['feed-pellets', 'animal feed pellets', 'wide'],
  ['cold-storage', 'cold storage warehouse', 'wide'],
  ['heat-network-pipes', 'district heating pipes', 'wide'],
  ['heat-pump-unit', 'heat pump', 'wide'],
  ['flood-map', 'flood map', 'wide'],
  ['town-river', 'river flood town', 'wide'],
  ['plastic-flakes', 'recycled plastic flakes', 'wide'],
  ['collectors-sorting', 'plastic waste sorting recycling', 'wide'],
  ['recycled-bench', 'recycled plastic bench', 'wide'],
  ['small-wind-turbine', 'small wind turbine', 'wide'],
  ['wind-blade-repair', 'wind turbine blade repair', 'wide'],
  ['tea-harvest', 'tea pickers sri lanka', 'wide'],
  ['tea-shade-trees', 'tea plantation trees', 'wide'],
  ['bamboo-building', 'bamboo architecture', 'wide'],
  ['bamboo-beams', 'bamboo construction beams', 'wide'],
];

/** a wikimedia upload URL at `px` wide; other hosts are returned as they are */
const sized = (url, px) => {
  url = url.replace(/\?.*$/, '');
  const m = url.match(/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/([0-9a-f])\/([0-9a-f]{2})\/([^/]+)$/);
  return m ? `${m[1]}/thumb/${m[2]}/${m[3]}/${m[4]}/${px}px-${m[4]}${/\.svg$/i.test(m[4]) ? '.png' : ''}` : url;
};

// second tries for slots the first query left thin
const alt = {
  'solar-school-roof': ['solar panels roof', 'rooftop solar'], 'solar-pump-field': ['solar irrigation', 'solar panels farm'],
  'battery-rack': ['battery energy storage', 'lithium battery pack'], 'solar-maintenance': ['solar panel technician', 'solar panels workers'],
  'denim-yarn': ['yarn bobbins', 'cotton yarn spinning', 'textile mill'], 'workwear-sorting': ['clothes sorting recycling', 'used clothing bales', 'textile waste'],
  'hemp-fabric': ['linen fabric', 'natural fabric texture'], 'mangrove-planting': ['mangrove restoration', 'planting mangroves'],
  'mangrove-survey': ['mangrove forest', 'mangroves coast'], 'mangrove-nursery': ['mangrove seedlings', 'tree nursery seedlings', 'seedlings nursery'],
  'hempcrete-wall': ['hemp lime wall', 'straw bale wall', 'natural building wall'], 'timber-frame': ['timber construction', 'wooden frame house'],
  'building-audit': ['architect blueprint', 'construction site engineer'], 'electric-van': ['electric van', 'ev charging van', 'cargo bike delivery'],
  'route-planning': ['logistics computer', 'warehouse office', 'delivery dispatch'], 'feed-pellets': ['feed pellets', 'fish feed', 'cattle feed'],
  'cold-storage': ['cold storage', 'refrigerated warehouse', 'food warehouse'], 'heat-network-pipes': ['district heating', 'insulated pipes trench', 'heating pipes'],
  'heat-pump-unit': ['heat pump unit', 'air source heat pump'], 'flood-map': ['flood risk map', 'flood map city', 'topographic map river'],
  'town-river': ['flooded street', 'river flood', 'flooding town'], 'plastic-flakes': ['plastic flakes', 'shredded plastic', 'pet bottles recycling'],
  'collectors-sorting': ['waste pickers', 'plastic recycling workers', 'recycling sorting'], 'recycled-bench': ['plastic bench', 'park bench recycled'],
  'small-wind-turbine': ['wind turbine farm field', 'small wind turbine house'], 'wind-blade-repair': ['wind turbine blade', 'wind turbine technician', 'wind turbine maintenance'],
  'tea-harvest': ['tea plucking', 'tea pickers', 'tea plantation workers'], 'tea-shade-trees': ['tea plantation', 'tea estate hills'],
  'bamboo-building': ['bamboo building', 'bamboo house', 'bamboo structure'], 'bamboo-beams': ['bamboo construction', 'bamboo scaffolding', 'bamboo poles'],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, as = 'json') {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.status === 429 || res.status === 403) { await sleep(8000 * (attempt + 1)); continue; }
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return as === 'json' ? res.json() : Buffer.from(await res.arrayBuffer());
  }
  throw new Error(`rate limited: ${url}`);
}

async function search() {
  const out = existsSync(file('candidates.json')) ? json('candidates.json') : {};
  const retry = process.argv.includes('--retry');
  for (const [slot, first, shape] of slots) {
    if (!retry && out[slot]?.length) continue;
    if (retry && (out[slot]?.length ?? 0) >= 4) continue;
    const queries = retry ? (alt[slot] ?? []) : [first];
    for (const q of queries) {
    const p = new URLSearchParams({ q, license_type: 'commercial', category: 'photograph', page_size: '20' });
    if (shape === 'wide') p.set('aspect_ratio', 'wide');
    let d;
    try { d = await get(`https://api.openverse.org/v1/images/?${p}`); } catch (e) { console.log(slot, 'failed', e.message); continue; }
    const big = shape === 'portrait' ? (r) => Math.min(r.width, r.height) >= 700 : (r) => r.width >= 1000 && r.width > r.height;
    // studio portraits (rawpixel, CC0) first for people; otherwise the search order
    const rank = (r) => (shape === 'portrait' && r.source === 'rawpixel' ? 0 : 1);
    const ok = (d.results ?? []).filter((r) => ['cc0', 'by', 'by-sa', 'pdm'].includes(r.license) && big(r)).sort((a, b) => rank(a) - rank(b))
      .map((r) => ({ id: r.id, url: r.url, thumb: r.thumbnail, title: r.title, creator: r.creator, license: r.license, version: r.license_version,
        source: r.source, page: r.foreign_landing_url, w: r.width, h: r.height }))
      .slice(0, 8);
    const seen = new Set((out[slot] ?? []).map((r) => r.id));
    out[slot] = [...(out[slot] ?? []), ...ok.filter((r) => !seen.has(r.id))].slice(0, 12);
    console.log(slot, q, '->', out[slot].length, out[slot].map((r) => r.source).join(','));
    writeFileSync(file('candidates.json'), JSON.stringify(out, null, 1));
    await sleep(3500);
    if (out[slot].length >= 8) break;
    }
  }
}


// Wikimedia Commons, for subjects Openverse ranks badly: node media.mjs commons <slot> [<slot> ...]
const commonsQueries = {
  'flood-map': ['flood hazard map', 'flood risk map'],
  'small-wind-turbine': ['small wind turbine', 'domestic wind turbine farm'],
  'bamboo-building': ['bamboo building', 'bamboo pavilion', 'bamboo architecture Bali'],
  'heat-network-pipes': ['district heating pipes', 'Fernwärme Rohre Baustelle', 'district heating construction'],
  'feed-pellets': ['fish feed pellets', 'feed pellets', 'pelleted feed'],
  'cold-storage': ['cold storage warehouse', 'cold store interior', 'refrigerated warehouse'],
  'route-planning': ['logistics control room', 'dispatcher computer', 'warehouse office computer'],
  'hemp-fabric': ['hemp fabric', 'hemp textile', 'linen fabric'],
  'hempcrete-wall': ['hempcrete', 'hemp lime construction', 'Hanfbeton'],
  'timber-frame': ['timber frame construction site', 'Holzrahmenbau', 'CLT construction'],
  'building-audit': ['building inspection', 'architects construction site plans', 'Bauleiter Baustelle'],
  'solar-pump-field': ['solar water pump India', 'solar irrigation pump'],
  'workwear-sorting': ['textile recycling', 'clothing sorting', 'Altkleider Sortierung'],
};
const okLicence = (l = '') => /^(cc0|cc by(-sa)? [0-9.]+|public domain|pd)/i.test(l) && !/nc|nd/i.test(l);
const text = (html = '') => html.replace(/<[^>]+>/g, '').trim().slice(0, 80);
async function commons(slotsWanted) {
  const out = existsSync(file('candidates.json')) ? json('candidates.json') : {};
  for (const slot of slotsWanted) {
    const shape = slots.find((s) => s[0] === slot)?.[2] ?? 'wide';
    const found = []; const seen = new Set((out[slot] ?? []).map((r) => r.id));
    for (const q of commonsQueries[slot] ?? [slot.replace(/-/g, ' ')]) {
      const p = new URLSearchParams({ action: 'query', format: 'json', generator: 'search', gsrsearch: `${q} filetype:bitmap`, gsrnamespace: '6', gsrlimit: '20',
        prop: 'imageinfo', iiprop: 'url|size|extmetadata', iiextmetadatafilter: 'LicenseShortName|Artist|ImageDescription' });
      let d;
      try { d = await get(`https://commons.wikimedia.org/w/api.php?${p}`); } catch (e) { console.log(slot, q, 'failed', e.message.slice(0, 60)); continue; }
      for (const pg of Object.values(d.query?.pages ?? {})) {
        const ii = pg.imageinfo?.[0]; if (!ii) continue;
        const lic = ii.extmetadata?.LicenseShortName?.value ?? '';
        const big = shape === 'portrait' ? Math.min(ii.width, ii.height) >= 700 : ii.width >= 1000 && ii.width > ii.height;
        const id = `commons:${pg.pageid}`;
        if (!okLicence(lic) || !big || seen.has(id) || /\.(tif|tiff|svg|pdf)$/i.test(ii.url)) continue;
        seen.add(id);
        found.push({ id, url: ii.url, thumb: sized(ii.url, 640), title: pg.title.replace(/^File:/, ''), creator: text(ii.extmetadata?.Artist?.value), license: lic.toLowerCase().replace(/^cc /, '').replace(/ .*/, ''),
          version: (lic.match(/[0-9.]+/) ?? [''])[0], source: 'wikimedia', page: ii.descriptionurl, w: ii.width, h: ii.height });
      }
      await sleep(1200);
      if (found.length >= 12) break;
    }
    out[slot] = [...found.slice(0, 12), ...(out[slot] ?? [])].slice(0, 18);
    console.log(slot, '->', found.length, 'from commons');
    writeFileSync(file('candidates.json'), JSON.stringify(out, null, 1));
  }
}

// contact sheets, four slots per image: tiles numbered, so a pick is "slot": index in picks.json
async function sheet() {
  const cands = json('candidates.json');
  mkdirSync(file('sheets'), { recursive: true });
  const T = 200, PER = 6, GAP = 6, HEAD = 28;
  for (let g = 0; g * 4 < slots.length; g++) {
    const group = slots.slice(g * 4, g * 4 + 4);
    const dest = file(`sheets/${String(g + 1).padStart(2, '0')}-${group[0][0]}.jpg`);
    if (existsSync(dest)) continue;
    const comps = []; let top = 0;
    for (const [slot] of group) {
      const list = cands[slot] ?? [];
      comps.push({ input: Buffer.from(`<svg width="${PER * (T + GAP)}" height="${HEAD}"><text x="4" y="20" font-size="18" font-family="sans-serif" font-weight="bold" fill="#111">${slot}</text></svg>`), left: 0, top });
      top += HEAD;
      for (const [i, c] of list.entries()) {
        try {
          const buf = await get(sized(c.url, 500), 'buffer');
          const tile = await sharp(buf).rotate().resize(T, T, { fit: 'cover' }).toBuffer();
          const label = Buffer.from(`<svg width="${T}" height="${T}"><rect x="0" y="0" width="34" height="28" fill="black" opacity=".7"/><text x="6" y="22" font-size="20" font-family="sans-serif" fill="white">${i}</text></svg>`);
          comps.push({ input: await sharp(tile).composite([{ input: label }]).toBuffer(), left: (i % PER) * (T + GAP), top: top + Math.floor(i / PER) * (T + GAP) });
        } catch (e) { console.log(slot, i, 'thumb failed', e.message.slice(0, 80)); }
      }
      top += Math.ceil(Math.max(list.length, 1) / PER) * (T + GAP) + 10;
    }
    await sharp({ create: { width: PER * (T + GAP), height: top, channels: 3, background: '#e9e9e9' } }).composite(comps).jpeg({ quality: 82 }).toFile(dest);
    console.log('sheet', dest);
  }
}

// picks.json: { slot: index }  -> media/<slot>.webp and CREDITS.json
async function fetchPicks() {
  const cands = json('candidates.json'), picks = json('picks.json');
  mkdirSync(file('media'), { recursive: true });
  const credits = existsSync(file('CREDITS.json')) ? json('CREDITS.json') : {};
  for (const [slot, , shape] of slots) {
    const pk = picks[slot];
    const c = typeof pk === 'string' ? cands[pk.split(':')[0]]?.[Number(pk.split(':')[1])] : cands[slot]?.[pk];
    if (!c) { console.log('no pick for', slot); continue; }
    const dest = file(`media/${slot}.webp`);
    if (!existsSync(dest)) {
      const buf = await get(sized(c.url, 1920), 'buffer');
      const img = sharp(buf).rotate();
      if (shape === 'portrait') await img.resize(800, 800, { fit: 'cover', position: 'attention' }).webp({ quality: 82 }).toFile(dest);
      else await img.resize(1200, 800, { fit: 'cover', position: 'attention', withoutEnlargement: false }).webp({ quality: 80 }).toFile(dest);
      console.log('saved', slot);
      await sleep(800);
    }
    credits[slot] = { title: c.title, creator: c.creator, license: `${c.license.toUpperCase()}${c.version ? ' ' + c.version : ''}`, source: c.source, page: c.page };
  }
  writeFileSync(file('CREDITS.json'), JSON.stringify(credits, null, 1));
}

const cmd = process.argv[2];
if (cmd === 'search') await search();
else if (cmd === 'commons') await commons(process.argv.slice(3));
else if (cmd === 'sheet') await sheet();
else if (cmd === 'fetch') await fetchPicks();
else { console.error('search | commons <slots> | sheet | fetch'); process.exit(2); }
