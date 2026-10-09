"""Import Diksha's story library into the site.

    python3 scripts/import-stories.py <export dir> <repo root> [image-sizes.json]

<export dir> holds one folder per industry (Drive "Showcase" folder names), each with the story files
"Category - Subcategory - Company Product.md" as exported from Drive (Markdown with backslash escapes).
Writes src/content/stories/<sub-category slug>/<story slug>.md with typed front-matter (see
src/content.config.ts). image-sizes.json comes from scripts/story-image-sizes.py. Re-running replaces
files with the same slug.
"""
import re, sys, os, json, html, glob, unicodedata
import yaml

RAW, REPO = sys.argv[1], sys.argv[2]
# Commons renditions resolved by wiki_thumbs.py: original URL -> 1280px thumb + size
THUMBS = json.load(open(sys.argv[3])) if len(sys.argv) > 3 else {}
OUT = f'{REPO}/src/content/stories'

# taxonomy from src/data/industries.ts: industry name -> {normalised sub name: slug}
ts = open(f'{REPO}/src/data/industries.ts').read()
SUBS = {}
for block in re.finditer(r"slug: '([a-z-]+)', name: '([^']+)'.*?subs: \[(.*?)\]", ts, re.S):
    ind = block.group(2)
    SUBS[ind] = {}
    for slug, name in re.findall(r"sub\('([a-z-]+)', '([^']+)'\)", block.group(3)):
        SUBS[ind][name] = slug
def norm(s): return re.sub(r'[^a-z0-9]', '', s.lower())
FOLDER_TO_IND = {'Technology': 'Technology', 'Energy': 'Energy', 'Materials Science': 'Materials science',
  'Green Architecture': 'Green architecture', 'Transportation and Logistics': 'Transportation and logistics',
  'Eco-restoration': 'Eco-restoration', 'Planetary Engineering': 'Planetary engineering', 'Advanced Technology': 'Advanced technology'}
ALIASES = {'evs': 'EVs', 'electricvehicles': 'EVs', 'nanotechnology': 'NanoTech', 'ecoacoustics': 'Eco-acoustics'}

def parse_fm(block):
    """Drive front-matter is YAML-ish: one `key: value` per line, values may contain colons,
    lists are `[a, b]` or following `- item` lines."""
    out, last = {}, None
    for line in block.split('\n'):
        if not line.strip(): continue
        item = re.match(r'\s*-\s+(.*)', line)
        if item and last:
            if not isinstance(out[last], list): out[last] = []
            out[last].append(item.group(1).strip().strip('"'))
            continue
        kv = re.match(r'([A-Za-z_]+):\s*(.*)', line)
        if not kv: continue
        k, v = kv.group(1), kv.group(2).strip()
        last = k
        if v.startswith('[') and v.endswith(']'):
            out[k] = [x.strip().strip('"\'') for x in v[1:-1].split(',') if x.strip()]
        elif len(v) > 1 and v[0] == '"' and v[-1] == '"':
            out[k] = json.loads(v) if '\\' not in v else v[1:-1]
        else:
            out[k] = v
    return out

def unescape(t):
    t = re.sub(r'\\([\\`*_{}\[\]()#+\-.!|>~<&=:"\'$%^@,;/?])', r'\1', t)
    return '\n'.join(l.rstrip() for l in t.split('\n'))

def slugify(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()
    return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', s.lower())).strip('-')

def md_inline_to_html(s):
    out, pos = [], 0
    for m in re.finditer(r'\[([^\]]+)\]\((https?://[^)\s]+)\)', s):
        out.append(html.escape(s[pos:m.start()]))
        out.append(f'<a href="{html.escape(m.group(2), quote=True)}" target="_blank" rel="noopener">{html.escape(m.group(1))}</a>')
        pos = m.end()
    out.append(html.escape(s[pos:]))
    return ''.join(out)

def strip_italic(l):
    l = l.strip()
    return l[1:-1].strip() if len(l) > 1 and l[0] == '*' and l[-1] == '*' and not l.startswith('**') else None

report, seen = [], {}
files = sorted(glob.glob(f'{RAW}/*/*.md'))
for path in files:
    folder = os.path.basename(os.path.dirname(path)); fname = os.path.basename(path)[:-3]
    t = unescape(open(path).read())
    m = re.match(r'\s*---\n(.*?)\n---\n(.*)', t, re.S)
    if not m: report.append(f'NO FRONTMATTER {fname}'); continue
    fm = parse_fm(m.group(1)); body = m.group(2).split('\n')
    ind = FOLDER_TO_IND[folder]
    subname = str(fm.get('subcategory', '')).strip()
    table = {norm(k): v for k, v in SUBS[ind].items()}
    key = norm(subname); key = norm(ALIASES.get(key, subname)) if key not in table else key
    sub = table.get(key) or table.get(norm(ALIASES.get(key, '')))
    if not sub:
        # try the subcategory from the file name
        parts = fname.split(' - ')
        sub = table.get(norm(parts[1])) if len(parts) > 2 else None
    if not sub: report.append(f'NO SUB MATCH {fname} ({subname})'); continue

    # body: drop the H1, collect the dek lines under it
    i = 0
    while i < len(body) and not body[i].strip(): i += 1
    if i < len(body) and body[i].startswith('# '): i += 1
    dek = []
    while i < len(body):
        if not body[i].strip():
            i += 1; continue
        it = strip_italic(body[i])
        if it is None: break
        dek.append(it); i += 1
    rest = body[i:]
    # "Technology / Agriculture. Maassluis, Netherlands. Presented ..." is a dateline, not a standfirst
    dateline = next((d for d in dek if re.match(r'^[A-Z][\w&,\- ]+ / [\w&,\- ]+\.', d)), None)
    if dateline: dek.remove(dateline)

    glance, image, links, keep = [], None, [], []
    j = 0
    while j < len(rest):
        l = rest[j]
        if re.match(r'>\s*\[!\w+\]', l):
            j += 1
            while j < len(rest) and rest[j].startswith('>'):
                g = re.match(r'>\s*(?:-\s*)?\*\*(.+?):\*\*\s*(.+)', rest[j])
                if g: glance.append({'label': g.group(1).strip(), 'text': g.group(2).strip()})
                elif rest[j].strip('> ').strip(): report.append(f'GLANCE LINE DROPPED {fname}: {rest[j][:80]}')
                j += 1
            continue
        im = re.match(r'!\[(.*?)\]\((https?://[^)\s]+)\)\s*$', l.strip())
        if im and image is None:
            cap = None
            k = j + 1
            if k < len(rest) and strip_italic(rest[k]) is not None:
                cap = md_inline_to_html(strip_italic(rest[k])); j = k
            image = {'src': im.group(2), 'alt': im.group(1).strip()}
            th = THUMBS.get(im.group(2))
            if th: image.update(src=th['thumb'].split('?')[0], width=th['width'], height=th['height'])
            if cap: image['caption'] = cap
            j += 1; continue
        if re.match(r'\s*SDGs?:\s*(#SDG\d+\s*)+$', l): j += 1; continue
        if l.strip() and all(w.startswith('#') and len(w) > 1 and not w.startswith('##') for w in l.split()): j += 1; continue
        lk = re.match(r'\*\*(Links|Follow):\*\*\s*(.+)', l.strip())
        if lk:
            for label, href in re.findall(r'\[([^\]]+)\]\((https?://[^)\s]+)\)', lk.group(2)):
                links.append({'label': label.strip(), 'href': href})
            j += 1; continue
        keep.append(l); j += 1
    text = re.sub(r'\n{3,}', '\n\n', '\n'.join(keep)).strip() + '\n'

    parts = fname.split(' - ', 2)
    slug = slugify(parts[2] if len(parts) == 3 else fm.get('title', fname))
    if slug in seen: slug = f'{slug}-{sub}'
    seen[slug] = fname
    raw_sdgs = fm.get('sdgs') or []
    if isinstance(raw_sdgs, str): raw_sdgs = raw_sdgs.split(',')  # "7, 8, 13" written without brackets
    sdgs = sorted({int(x) for x in raw_sdgs if str(x).strip().isdigit()})
    if not sdgs: report.append(f'NO SDGS {fname}')
    out = {
        'title': str(fm['title']).strip(), 'dek': dek, **({'dateline': dateline} if dateline else {}), 'sub': sub,
        'company': str(fm.get('company', '')).strip(), 'product': str(fm.get('product', '')).strip(),
        'country': str(fm.get('country', '')).strip(),
    }
    if fm.get('launch_date'): out['launchDate'] = str(fm['launch_date']).strip()
    out['sdgs'] = sdgs
    out['tags'] = [str(x) for x in (fm.get('tags') or [])]
    out['sources'] = [str(x).strip() for x in (fm.get('sources') or [])]
    if glance: out['glance'] = glance
    if image: out['image'] = image
    if links: out['links'] = links
    for k in ('company', 'product', 'country'):
        if not out[k]: report.append(f'MISSING {k} {fname}')
    if not dek: report.append(f'NO DEK {fname}')
    if not glance: report.append(f'NO GLANCE {fname}')
    bad = [s for s in out['sources'] if not re.match(r'https?://', s)]
    if bad: report.append(f'BAD SOURCE {fname}: {bad}'); out['sources'] = [s for s in out['sources'] if s not in bad]
    os.makedirs(f'{OUT}/{sub}', exist_ok=True)
    y = yaml.safe_dump(out, allow_unicode=True, sort_keys=False, width=1000)
    open(f'{OUT}/{sub}/{slug}.md', 'w').write(f'---\n{y}---\n\n{text}')

print(len(files), 'raw files;', len(seen), 'written')
from collections import Counter
c = Counter(os.path.basename(os.path.dirname(p)) for p in glob.glob(f'{OUT}/*/*.md'))
for ind, subs in SUBS.items():
    print(ind, {s: c.get(s, 0) for s in subs.values()})
print('\n'.join(report) or 'no anomalies')
