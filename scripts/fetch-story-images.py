"""Download each story's photo into src/assets/stories/ so the build can resize and re-encode it.

    python3 scripts/fetch-story-images.py

Reads image.src from every story's front-matter (a Wikimedia Commons 1280px rendition, see
story-image-sizes.py) and saves it as src/assets/stories/<story slug>.<ext>. Files already on disk are
skipped. Then run scripts/compress-story-images.mjs. Wikimedia rate-limits bursts, so requests go one at a time and back off on HTTP 429.
"""
import glob, os, re, sys, time, urllib.error, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'src', 'assets', 'stories')
UA = 'QuintaEarthSiteBuild/1.0 (quintaearth@gmail.com)'
os.makedirs(OUT, exist_ok=True)

done, failed = 0, []
for path in sorted(glob.glob(os.path.join(ROOT, 'src', 'content', 'stories', '*', '*.md'))):
    slug = os.path.basename(path)[:-3]
    m = re.search(r'^image:\n  src: (\S+)', open(path).read(), re.M)
    if not m: continue
    url = m.group(1)
    ext = os.path.splitext(url.split('?')[0])[1].lower() or '.jpg'
    if ext == '.jpeg': ext = '.jpg'
    if ext not in ('.jpg', '.png', '.webp', '.gif'): ext = '.jpg'
    dest = os.path.join(OUT, slug + ext)
    # already fetched (possibly converted to .webp by compress-story-images.mjs)
    if glob.glob(os.path.join(OUT, slug + '.*')): continue
    for attempt in range(6):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=60) as r:
                data = r.read()
            open(dest, 'wb').write(data)
            done += 1
            break
        except urllib.error.HTTPError as e:
            if e.code == 429: time.sleep(5 * (attempt + 1)); continue
            failed.append(f'{slug}: HTTP {e.code}'); break
        except Exception as e:  # network hiccup
            time.sleep(3); last = e
    else:
        failed.append(f'{slug}: gave up')
    time.sleep(1.2)
print(f'downloaded {done}; failed {len(failed)}')
print('\n'.join(failed))
