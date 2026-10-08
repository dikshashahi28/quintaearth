"""Map each story's Wikimedia Commons image to a 1280px-wide rendition and its size, via the Commons API.

    python3 scripts/story-image-sizes.py <file with one image URL per line> <out.json>
"""
import json, re, sys, time, urllib.parse, urllib.request
urls = [l.strip() for l in open(sys.argv[1]) if l.strip()]
out = sys.argv[2]
def filename(u):
    u = urllib.parse.unquote(u)
    m = re.search(r'/commons/thumb/[0-9a-f]/[0-9a-f]{2}/([^/]+)/', u) or re.search(r'/commons/[0-9a-f]/[0-9a-f]{2}/([^/?#]+)$', u)
    return m.group(1) if m else None
names = {u: filename(u) for u in urls}
result, missing = {}, []
titles = sorted({n for n in names.values() if n})
for i in range(0, len(titles), 50):
    batch = titles[i:i + 50]
    q = urllib.parse.urlencode({'action': 'query', 'format': 'json', 'prop': 'imageinfo', 'iiprop': 'url|size',
                                'iiurlwidth': 1280, 'titles': '|'.join('File:' + t for t in batch)})
    req = urllib.request.Request('https://commons.wikimedia.org/w/api.php?' + q, headers={'User-Agent': 'QuintaEarthSiteBuild/1.0 (quintaearth@gmail.com)'})
    data = json.load(urllib.request.urlopen(req, timeout=30))
    norm = {n['to']: n['from'] for n in data['query'].get('normalized', [])}
    for p in data['query']['pages'].values():
        t = p['title']; t = norm.get(t, t)[5:]
        ii = (p.get('imageinfo') or [None])[0]
        if not ii: missing.append(t); continue
        result[t] = {'thumb': ii.get('thumburl') or ii['url'], 'width': ii.get('thumbwidth') or ii['width'], 'height': ii.get('thumbheight') or ii['height'], 'orig': ii['width']}
    time.sleep(1)
mapping = {}
for u, n in names.items():
    r = result.get(n) or result.get(n.replace('_', ' ')) if n else None
    if r: mapping[u] = r
    else: missing.append(u)
json.dump(mapping, open(out, 'w'), indent=1)
print(len(urls), 'urls;', len(mapping), 'mapped;', 'missing:', missing)
