# End-to-end checks of the member features (login, profiles, companies, listings, uploads, directory,
# enquiries, invitations, identity checks) against the local dev server, including every permission denial.
# Run `pnpm dev`, then `pnpm test:members`. Needs only Python 3; uses the dev-only mail outbox and local D1.
import json, os, re, ssl, subprocess, sys, uuid, urllib.request, urllib.parse, http.cookiejar, struct, zlib
# QE_BASE: the server under test (default: the dev server). QE_MAIL: where to read sent mail — unset uses the dev
# server's outbox; set it to the mail sink (http://127.0.0.1:8025) when testing a production build.
# QE_PERSIST: wrangler --persist-to directory of the server's local D1, when it is not the default.
B = os.environ.get('QE_BASE', 'http://localhost:4321').rstrip('/')
MAIL = os.environ.get('QE_MAIL', '').rstrip('/')
PERSIST = os.environ.get('QE_PERSIST', '')
# local https uses a self-signed certificate
TLS = ssl._create_unverified_context() if B.startswith('https://') else None
REPO = str(__import__('pathlib').Path(__file__).resolve().parent.parent)
RUN = uuid.uuid4().hex[:6]
PW = f'river-{RUN}-stone'  # every test member's password
results = []

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k): return None

class User:
    def __init__(self, name):
        self.email = f'{name}.{RUN}@example.com'
        self.jar = http.cookiejar.CookieJar()
        self.op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar), NoRedirect, urllib.request.HTTPSHandler(context=TLS))
    def req(self, method, path, data=None, headers=None):
        r = urllib.request.Request(B + path, data=data, method=method, headers={'Origin': B, **(headers or {})})
        try:
            with self.op.open(r) as res: return res.status, res.headers, res.read()
        except urllib.error.HTTPError as e: return e.code, e.headers, e.read()
    def form(self, path, fields):
        return self.req('POST', path, urllib.parse.urlencode(fields, doseq=True).encode(), {'Content-Type': 'application/x-www-form-urlencoded'})
    def action(self, name, fields=None, files=None):
        bnd = 'b' + uuid.uuid4().hex
        body = b''
        for k, v in (fields or {}).items():
            for item in (v if isinstance(v, list) else [v]):
                body += f'--{bnd}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{item}\r\n'.encode()
        for k, (fname, ctype, data) in (files or {}).items():
            body += f'--{bnd}\r\nContent-Disposition: form-data; name="{k}"; filename="{fname}"\r\nContent-Type: {ctype}\r\n\r\n'.encode() + data + b'\r\n'
        body += f'--{bnd}--\r\n'.encode()
        st, _, out = self.req('POST', f'/_actions/{name}', body, {'Content-Type': f'multipart/form-data; boundary={bnd}', 'Accept': 'application/json'})
        try:
            j = json.loads(out) if out else None
            if st == 200 and isinstance(j, list): j = undevalue(j)
        except Exception: j = out[:200]
        return st, j

def undevalue(flat):
    # Astro answers successful actions in devalue's flattened form: index 0 is the root, containers hold indices
    def at(i):
        if i == -1: return None
        v = flat[i]
        if isinstance(v, dict): return {k: at(x) for k, x in v.items()}
        if isinstance(v, list):
            if v and isinstance(v[0], str) and v[0] in ('Date',): return v[1]
            return [at(x) for x in v]
        return v
    return at(0)

def check(label, ok, detail=''):
    results.append((label, 'PASS' if ok else 'FAIL', detail))
    print(('PASS ' if ok else 'FAIL ') + label + (f'  [{detail}]' if not ok or detail else ''))

def outbox(email):
    if MAIL:
        try:
            with urllib.request.urlopen(MAIL + '/last?to=' + urllib.parse.quote(email)) as r: return json.loads(r.read())
        except urllib.error.HTTPError: return None
    st, _, b = User('x').req('GET', '/api/dev/outbox?to=' + urllib.parse.quote(email))
    return json.loads(b) if st == 200 else None

def link_in(mail): return re.search(re.escape(B) + r'/\S+', mail['text']).group(0)

def follow_link(u, url):
    # an emailed sign-in link opens a page with one Continue button (a GET spends nothing); pressing it posts the
    # page's hidden fields back, which signs in and redirects. Answers like req() with the post's response.
    path = url.replace(B, '')
    st, _, b = u.req('GET', path)
    fields = dict(re.findall(rb'<input type="hidden" name="([^"]+)" value="([^"]*)"', b))
    fields = {k.decode(): __import__('html').unescape(v.decode()) for k, v in fields.items()}
    return u.form(urllib.parse.urlparse(path).path, fields)

def sql(q):
    cmd = ['pnpm', '-s', 'wrangler', 'd1', 'execute', 'quintaearth', '--local', '--json', '--command', q] + (['--persist-to', PERSIST] if PERSIST else [])
    out = subprocess.run(cmd, cwd=REPO, capture_output=True, text=True).stdout
    return json.loads(out)[0]['results']

def login(u, kind, company=''):
    u.form('/signin?_action=account.sendSignInLink', {'email': u.email, 'next': '/dashboard'})
    st, h, _ = follow_link(u, link_in(outbox(u.email)))
    st, h, _ = u.form('/welcome?_action=account.chooseAccountType', {'name': u.email.split('.')[0].title() + ' Test', 'type': kind, 'company': company, 'password': PW})
    # a successful POST answers 303 (Grok 14); it was 302 before 11 Oct
    return st == 303 and h['Location'].endswith('/dashboard')

def png(w=2, h=2):
    raw = b''.join(b'\x00' + b'\x80\xa0\x60' * w for _ in range(h))
    chunk = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw)) + chunk(b'IEND', b'')
PDF = b'%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n'
FAKE = b'<html><script>alert(1)</script></html>'

A, Bu, C, D = User('owner'), User('buyer'), User('admin'), User('teammate')
check('login owner (company)', login(A, 'company', f'Sun Grid Labs {RUN}'))
check('login buyer (individual)', login(Bu, 'individual'))
check('login admin-to-be (individual)', login(C, 'individual'))
check('login teammate (individual)', login(D, 'individual'))
# a double-submitted welcome form: one profile, one company, no error page
W = User('twice')
W.form('/signin?_action=account.sendSignInLink', {'email': W.email, 'next': '/dashboard'})
follow_link(W, link_in(outbox(W.email)))
import threading
wc = []
ts = [threading.Thread(target=lambda: wc.append(W.form('/welcome?_action=account.chooseAccountType', {'name': 'Twice Test', 'type': 'company', 'company': f'Twice {RUN}', 'password': PW})[0])) for _ in range(4)]
[t.start() for t in ts]; [t.join() for t in ts]
wrow = sql(f"select (select count(*) from profiles p where p.user_id=u.id) p, (select count(*) from members m where m.user_id=u.id) m from user u where email='{W.email}'")[0]
check('double-submitted welcome: one profile, one company, no 500', wrow == {'p': 1, 'm': 1} and 500 not in wc, f'{wrow} {wc}')
org = sql(f"select o.id, o.slug from organizations o join members m on m.organization_id=o.id join user u on u.id=m.user_id where u.email='{A.email}'")[0]
OID, OSLUG = org['id'], org['slug']

# profile
st, j = Bu.action('profile.update', {'name': 'Asha Rao', 'headline': 'Solar engineer', 'bio': 'I design rooftop solar for schools.', 'city': 'Pune', 'country': 'IN',
    'website': 'asha.example.com', 'industries': ['energy'], 'subs': ['energy-solar'], 'sdgs': ['7', '13'], 'skills': 'Solar PV, rooftop design, solar pv', 'published': 'on'})
check('profile.update valid', st == 200 and j['published'] is True, f'{st} {j}')
handle = j['handle'] if st == 200 else ''
n = sql(f"select count(*) n from tags t join profiles p on t.entity_id=p.id where p.handle='{handle}' and t.kind='sdg'")[0]['n']
check('profile.update stores no UN goals, even if sent', n == 0, f'{n}')
st, _, b = Bu.req('GET', '/dashboard/profile')
check('profile editor has no UN goals picker', st == 200 and b'name="sdgs"' not in b and b'name="industries"' in b, f'{st}')
st, j = Bu.action('profile.update', {'name': 'Asha Rao', 'industries': ['not-an-industry']})
check('profile.update rejects unknown industry', st == 400, f'{st}')
st, j = Bu.action('profile.update', {'name': 'Asha Rao', 'website': 'javascript:alert(1)'})
check('profile.update rejects javascript: url', st == 400, f'{st}')
row = sql(f"select p.website, (select group_concat(value) from tags where entity_id=p.id and kind='skill') skills from profiles p where handle='{handle}'")[0]
check('profile url normalised + skills deduped', row['website'] == 'https://asha.example.com/' and row['skills'].lower().split(',').count('solar pv') == 1, str(row))
st, j = User('anon').action('profile.update', {'name': 'Xavier Test'})
check('profile.update signed out -> 401', st == 401, f'{st}')
st, j = Bu.action('profile.setPhoto', files={'photo': ('me.png', 'image/png', png())})
check('profile.setPhoto png', st == 200, f'{st} {j}')
st, j = Bu.action('profile.setPhoto', files={'photo': ('me.png', 'image/png', FAKE)})
check('profile.setPhoto rejects html disguised as png', st == 400, f'{st}')

# company
st, j = A.action('company.update', {'organizationId': OID, 'name': f'Sun Grid Labs {RUN}', 'description': 'Solar microgrids for villages and cold storage.', 'city': 'Pune', 'country': 'IN',
    'size': '11-50', 'foundedYear': '2019', 'website': 'sungrid.example', 'industries': ['energy'], 'subs': ['energy-solar'], 'sdgs': ['7'], 'published': 'on'})
check('company.update by owner', st == 200, f'{st} {j}')
st, j = A.action('company.update', {'organizationId': OID, 'name': 'X Co', 'foundedYear': '2999'})
check('company.update rejects future year', st == 400, f'{st}')
st, j = Bu.action('company.update', {'organizationId': OID, 'name': 'Hijacked'})
check('company.update by outsider -> 403', st == 403, f'{st}')
st, j = A.action('company.setLogo', files={'logo': ('logo.png', 'image/png', png())}, fields={'organizationId': OID})
logo = j.get('key') if st == 200 and isinstance(j, dict) else None
check('company.setLogo', st == 200 and logo, f'{st} {j}')
st, h, b = User('anon').req('GET', f'/files/{logo}')
check('public logo served as image/png with nosniff', st == 200 and h['Content-Type'] == 'image/png' and h['X-Content-Type-Options'] == 'nosniff', f'{st}')

# listings
st, j = A.action('listings.save', {'organizationId': OID, 'name': 'Village solar microgrid', 'kind': 'product', 'description': 'A 30 kW solar microgrid with battery storage.',
    'subs': ['energy-solar'], 'serves': ['IN', 'KE'], 'status': 'published'})
LID = j.get('id') if st == 200 else None
check('listings.save create', st == 200 and LID, f'{st} {j}')
codes = [r['iso'] for r in [{'iso': c} for c in re.findall(r"iso: '([A-Z]{2})'", open(REPO + '/src/data/countries.ts').read())]][:60]
# uploads up to the stated limits get through (Astro's default action body limit is 1 MB)
st, j = A.action('listings.setPhoto', {'listingId': LID}, {'photo': ('big.png', 'image/png', png() + b'\0' * (3 * 1024 * 1024))})
check('3 MB listing photo accepted', st == 200, f'{st}')
st, j = A.action('listings.addEvidence', {'listingId': LID}, {'file': ('big.pdf', 'application/pdf', PDF + b'%' * (8 * 1024 * 1024))})
check('8 MB evidence accepted', st == 200, f'{st}')
A.action('listings.removeEvidence', {'key': j['key']} if st == 200 else {'key': 'x'})
st, j = A.action('profile.update', {'name': 'Owner Test', 'website': 'ftp://files.example.com'})
check('ftp:// web address rejected', st == 400, f'{st}')

# parallel uploads cannot pass the 10-file evidence limit
import threading
for i in range(8): A.action('listings.addEvidence', {'listingId': LID}, {'file': (f'e{i}.pdf', 'application/pdf', PDF)})
rcodes = []
ts = [threading.Thread(target=lambda: rcodes.append(A.action('listings.addEvidence', {'listingId': LID}, {'file': ('race.pdf', 'application/pdf', PDF)})[0])) for _ in range(5)]
[t.start() for t in ts]; [t.join() for t in ts]
n_ev = sql(f"select count(*) n from files where listing_id='{LID}' and purpose='evidence'")[0]['n']
check('parallel evidence uploads stop at 10', n_ev == 10 and rcodes.count(200) == 2, f'{n_ev} {sorted(rcodes)}')
for k in [r['key'] for r in sql(f"select key from files where listing_id='{LID}' and purpose='evidence'")]: A.action('listings.removeEvidence', {'key': k})

# a double-clicked "Publish" makes one listing
rcodes = []
ts = [threading.Thread(target=lambda: rcodes.append(A.action('listings.save', {'organizationId': OID, 'name': f'Double click {RUN}', 'kind': 'product', 'status': 'published'})[0])) for _ in range(3)]
[t.start() for t in ts]; [t.join() for t in ts]
n_dc = sql(f"select count(*) n from listings where organization_id='{OID}' and name='Double click {RUN}'")[0]['n']
check('double-submitted new listing creates one', n_dc == 1 and set(rcodes) == {200}, f'{n_dc} {rcodes}')

st, j = A.action('listings.save', {'organizationId': OID, 'listingId': LID, 'name': 'Village solar microgrid', 'kind': 'product', 'description': 'A 30 kW solar microgrid with battery storage.',
    'subs': ['energy-solar'], 'serves': codes, 'status': 'published'})
n = sql(f"select count(*) n from tags where entity_id='{LID}' and kind='serves'")[0]['n']
check('listing can serve 60 countries (D1 bind limit)', st == 200 and n == 60, f'{st} {n}')
st, j = A.action('listings.addEvidence', {'listingId': LID}, {'file': ('test-report.pdf', 'application/pdf', PDF)})
EVID = j.get('key') if st == 200 else None
check('listings.addEvidence pdf', st == 200, f'{st} {j}')
st, j = Bu.action('listings.save', {'organizationId': OID, 'name': 'Spam', 'kind': 'product', 'status': 'published'})
check('listings.save by outsider -> 403', st == 403, f'{st}')
st, j = Bu.action('listings.remove', {'listingId': LID})
check('listings.remove by outsider -> 404 (same as a missing id)', st == 404, f'{st}')
st, j = Bu.action('listings.removeEvidence', {'key': EVID})
check('listings.removeEvidence by outsider -> 404 (same as a missing key)', st == 404, f'{st}')

# public pages + directory
anon = User('anon')
st, _, b = anon.req('GET', f'/companies/{OSLUG}')
check('company page public', st == 200 and b'Village solar microgrid' in b and b'test-report.pdf' in b, f'{st}')
st, _, b = anon.req('GET', f'/people/{handle}')
check('person page public', st == 200 and b'Asha Rao' in b, f'{st}')
st, _, b = anon.req('GET', '/directory?q=microgrid')
check('directory text search finds company via listing', st == 200 and OSLUG.encode() in b, f'{st}')
st, _, b = anon.req('GET', '/directory?q=rooftop&type=person')
check('directory finds person by bio text', handle.encode() in b, '')
st, _, b = anon.req('GET', '/directory?country=IN&industry=energy')
check('directory tag filters', OSLUG.encode() in b and handle.encode() in b, '')
st, _, b = anon.req('GET', '/directory?sdg=7&country=IN&industry=energy')
check('directory UN goal filter finds companies, not people', OSLUG.encode() in b and handle.encode() not in b, '')
st, _, b = anon.req('GET', '/directory?q=%22%29%20OR%20*')
check('directory survives hostile search text', st == 200, f'{st}')
st, _, b = anon.req('GET', '/directory?checked=1')
check('directory checked-only excludes unchecked company', OSLUG.encode() not in b, '')

# enquiries
st, j = Bu.action('enquiries.send', {'organizationId': OID, 'listingId': LID, 'fromCompany': 'Rao Schools Trust', 'subject': 'Microgrid for 3 schools', 'message': 'We need power for three rural schools near Pune. Can you quote?'})
EQ = j.get('id') if st == 200 else None
check('enquiries.send by buyer', st == 200, f'{st} {j}')
Bu.action('profile.update', {'name': 'Asha R. Rao'})
st, j = Bu.action('enquiries.send', {'organizationId': OID, 'subject': 'Second question', 'message': 'Do you also install in Gujarat? We have two more sites there.'})
check('enquiry stores the sender name as of now, not the cached session', sql(f"select from_name from enquiries where id='{j.get('id') if isinstance(j, dict) else ''}'")[0]['from_name'] == 'Asha R. Rao', f'{st}')
check('team alerted by email', bool(outbox(A.email)) and 'New enquiry' in outbox(A.email)['subject'], '')
st, j = A.action('enquiries.send', {'organizationId': OID, 'subject': 'Self', 'message': 'Sending to my own company should not work.'})
check('enquiries.send to own company -> 400', st == 400, f'{st}')
st, j = Bu.action('enquiries.send', {'organizationId': OID, 'subject': 'Bot', 'message': 'Filled the hidden field like a bot does.', 'website': 'spam'})
check('enquiries.send honeypot -> 400', st == 400, f'{st}')
st, j = A.action('enquiries.reply', {'enquiryId': EQ, 'body': 'Yes, we can. Sending a quote.'})
check('company reply', st == 200 and j['side'] == 'company', f'{st} {j}')
check('buyer alerted of reply', 'replied' in (outbox(Bu.email) or {}).get('subject', ''), '')
def unread(eid): return sql(f"select company_unread c, buyer_unread b from enquiries where id='{eid}'")[0]
check('company reply: unread for the buyer, read for the company', unread(EQ) == {'c': 0, 'b': 1}, str(unread(EQ)))
st, _, b = Bu.req('GET', '/dashboard')
check('buyer nav shows 1 new reply', st == 200 and re.search(rb'Sent enquiries<span class="n">1<', b) is not None, f'{st}')
Bu.req('GET', f'/dashboard/messages/{EQ}')
# the GET changes nothing (mail scanners prefetch it); the thread page posts enquiries.markRead once it is shown
Bu.action('enquiries.markRead', {'enquiryId': EQ})
check('buyer opening the thread reads it', unread(EQ)['b'] == 0, str(unread(EQ)))
st, j = Bu.action('enquiries.reply', {'enquiryId': EQ, 'body': 'Thanks, what is the lead time?'})
check('buyer reply: unread for the company again', st == 200 and unread(EQ) == {'c': 1, 'b': 0}, f'{st} {unread(EQ)}')
st, _, b = A.req('GET', '/dashboard/enquiries')
check('company list marks the replied thread new', b'<span class="sr">, new</span>' in b, f'{st}')
st, h, _ = A.form(f'/dashboard/enquiries/{EQ}?_action=enquiries.reply', {'enquiryId': EQ, 'body': 'About six weeks.'})
check('reply from the thread page confirms "Reply sent"', st == 303 and h['Location'].endswith('?flash=reply') and b'Reply sent.' in A.req('GET', h['Location'])[2], f'{st} {h.get("Location")}')
st, j = C.action('enquiries.reply', {'enquiryId': EQ, 'body': 'Nosy'})
check('outsider reply -> 404', st == 404, f'{st}')
st, j = Bu.action('enquiries.setStatus', {'enquiryId': EQ, 'status': 'closed'})
check('buyer cannot close company thread -> 404', st == 404, f'{st}')
st, j = A.action('enquiries.setStatus', {'enquiryId': EQ, 'status': 'closed'})
st2, j2 = Bu.action('enquiries.reply', {'enquiryId': EQ, 'body': 'One more thing'})
check('reply to closed enquiry -> 400', st == 200 and st2 == 400, f'{st} {st2}')

# team invites
st, j = A.action('company.invite', {'organizationId': OID, 'email': D.email.upper(), 'role': 'member'})
check('owner invites teammate', st == 200, f'{st} {j}')
token = urllib.parse.parse_qs(urllib.parse.urlparse(link_in(outbox(D.email))).query)['token'][0]
st, j = Bu.action('company.acceptInvite', {'token': token})
check('wrong account cannot accept invite -> 403', st == 403, f'{st}')
st, j = D.action('company.acceptInvite', {'token': token})
check('teammate accepts invite', st == 200, f'{st} {j}')
st, j = D.action('company.acceptInvite', {'token': token})
check('invite cannot be reused -> 404', st == 404, f'{st}')
# owners can cancel a pending invitation
R = User('revoked')
A.action('company.invite', {'organizationId': OID, 'email': R.email})
rtok = urllib.parse.parse_qs(urllib.parse.urlparse(link_in(outbox(R.email))).query)['token'][0]
st, j = D.action('company.revokeInvite', {'organizationId': OID, 'email': R.email})
check('non-owner cannot cancel invite -> 403', st == 403, f'{st}')
st, j = A.action('company.revokeInvite', {'organizationId': OID, 'email': R.email})
check('owner cancels invite', st == 200, f'{st} {j}')
login(R, 'individual')
st, j = R.action('company.acceptInvite', {'token': rtok})
check('cancelled invite link no longer works -> 404', st == 404, f'{st}')

# a brand-new person follows an invitation before ever signing in
E = User('newhire')
st, j = A.action('company.invite', {'organizationId': OID, 'email': E.email})
inv_path = link_in(outbox(E.email)).replace(B, '')
st, h, _ = E.req('GET', inv_path)
check('invite link sends a signed-out person to sign in', st == 302 and '/signin?next=' in h['Location'], f'{st}')
E.form('/signin?_action=account.sendSignInLink', {'email': E.email, 'next': inv_path})
st, h, _ = follow_link(E, link_in(outbox(E.email)))
check('new member lands back on the invitation', st == 303 and h['Location'].endswith(inv_path), h.get('Location', ''))
etok = urllib.parse.parse_qs(urllib.parse.urlparse(inv_path).query)['token'][0]
st, j = E.action('company.acceptInvite', {'token': etok})
st2, h2, _ = E.req('GET', '/dashboard')
check('after accepting, setup still asks for a name', st == 200 and st2 == 302 and h2['Location'].endswith('/welcome'), f'{st} {st2}')
st, h, _ = E.form('/welcome?_action=account.chooseAccountType', {'name': 'New Hire', 'password': PW})
row = sql(f"select u.name, u.account_type, (select count(*) from profiles p where p.user_id=u.id) profiles, (select count(*) from organizations o join members m on m.organization_id=o.id where m.user_id=u.id) orgs from user u where email='{E.email}'")[0]
check('invited member finishes setup: name, company type, profile, no extra company', row == {'name': 'New Hire', 'account_type': 'company', 'profiles': 1, 'orgs': 1}, str(row))
st, j = E.action('profile.update', {'name': 'New Hire', 'headline': 'Field engineer'})
check('invited member can edit their profile', st == 200, f'{st} {j}')
# right after setup, a public page must show the member's new name, not the empty one cached at sign-in
N = User('fresh')
N.form('/signin?_action=account.sendSignInLink', {'email': N.email, 'next': '/dashboard'})
follow_link(N, link_in(outbox(N.email)))
N.form('/welcome?_action=account.chooseAccountType', {'name': 'Nadia Fresh', 'type': 'individual', 'password': PW})
st, _, b = N.req('GET', f'/companies/{OSLUG}/enquire')
check('enquiry form names the sender right after setup', b'your name (Nadia Fresh)' in b, f'{st}')
st, h, _ = E.form('/welcome?_action=account.chooseAccountType', {'name': 'New Hire', 'type': 'individual', 'password': PW})
check('account type cannot be changed by posting setup again', sql(f"select account_type from user where email='{E.email}'")[0]['account_type'] == 'company', '')

# the login library's own account endpoints are closed
st, _, _ = Bu.req('POST', '/api/auth/update-user', json.dumps({'name': 'X' * 5000}).encode(), {'Content-Type': 'application/json'})
check('update-user endpoint closed', st == 404, f'{st}')
st, _, _ = anon.req('POST', '/api/auth/sign-in/magic-link', json.dumps({'email': 'z@example.com', 'name': 'Z' * 500}).encode(), {'Content-Type': 'application/json'})
check('raw magic-link endpoint closed', st == 404, f'{st}')

# passwords: the email link confirms an address once; after that, members sign in with email and password
def pw_signin(u, password, nxt='/dashboard'):
    return u.form('/signin?_action=account.signIn', {'email': u.email, 'password': password, 'next': nxt})
row = sql(f"select a.password from account a join user u on u.id=a.user_id where u.email='{A.email}' and a.provider_id='credential'")
check('welcome stores the password hashed (PBKDF2), not as typed', len(row) == 1 and row[0]['password'].startswith('pbkdf2-sha256$100000$') and PW not in row[0]['password'], str(row)[:80])
P = User('pw'); P.email = A.email
st, h, _ = pw_signin(P, PW)
st2, _, _ = P.req('GET', '/dashboard')
check('password sign-in -> dashboard, no email sent', st == 303 and h['Location'] == '/dashboard' and st2 == 200, f'{st} {h.get("Location")} {st2}')
P2 = User('pw2'); P2.email = A.email
st, h, _ = pw_signin(P2, PW, '//evil.example')
check('sign-in never redirects off-site', st == 303 and h['Location'] == '/dashboard', h.get('Location', ''))
X = User('pwx'); X.email = A.email
st, j = X.action('account.signIn', {'email': A.email, 'password': 'wrong-password-1'})
st2, j2 = X.action('account.signIn', {'email': f'nobody.{RUN}@example.com', 'password': 'wrong-password-1'})
check('wrong password and unknown email get the same 401', st == 401 and st2 == 401 and j.get('message') == j2.get('message') == 'Email or password is wrong.', f'{st} {st2} {j} {j2}')
st, j = X.action('account.signIn', {'email': f'pw.{RUN}@example.com', 'password': ''})
check('empty password -> 400', st == 400, f'{st}')
for _ in range(7): X.action('account.signIn', {'email': A.email, 'password': 'wrong-password-1'})
st, j = X.action('account.signIn', {'email': A.email, 'password': PW})
check('8 failures pause sign-in for that email from that address, even with the right password', st == 429, f'{st} {j}')
# the lock binds the guesser's network address only: the member, elsewhere, still gets in
Y = User('pwy'); Y.email = A.email
r = urllib.request.Request(B + '/_actions/account.signIn', data=urllib.parse.urlencode({'email': A.email, 'password': PW}).encode(), method='POST',
    headers={'Origin': B, 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json', 'cf-connecting-ip': '198.51.100.7'})
try:
    with Y.op.open(r) as res: st = res.status
except urllib.error.HTTPError as e: st = e.code
check('a stranger cannot lock a member out: other address still signs in', st == 200, f'{st}')
sql(f"delete from sign_in_failures where key like '%{A.email}%'")
st, j = X.action('account.signIn', {'email': A.email, 'password': PW})
check('sign-in works again once the pause ends', st == 200, f'{st} {j}')
S = User('short')
S.form('/signin?_action=account.sendSignInLink', {'email': S.email, 'next': '/dashboard'})
follow_link(S, link_in(outbox(S.email)))
st, j = S.action('account.chooseAccountType', {'name': 'Short Pw', 'type': 'individual', 'password': 'short'})
check('new member: password under 10 characters -> 400, account not set up', st == 400 and sql(f"select account_type from user where email='{S.email}'")[0]['account_type'] is None, f'{st}')
# forgotten password: the email link signs in once and lands on the password page
F = User('forgot'); F.email = Bu.email
F.form('/signin?_action=account.sendSignInLink', {'email': F.email, 'next': '/dashboard/messages'})
st, h, _ = follow_link(F, link_in(outbox(F.email)))
loc = urllib.parse.urlparse(h.get('Location', ''))
check('email link for a known member lands on the password page', st == 303 and loc.path == '/dashboard/password' and urllib.parse.parse_qs(loc.query).get('next') == ['/dashboard/messages'], h.get('Location', ''))
NEWPW = f'new-{RUN}-password'
st, h, _ = F.form('/dashboard/password?_action=account.setPassword&next=%2Fdashboard%2Fmessages', {'password': NEWPW})
check('fresh link sign-in sets a new password without the old one, then goes on (saying so)', st == 303 and h['Location'] == '/dashboard/messages?flash=password', f'{st} {h.get("Location")}')
check('old password stops working', User('o').action('account.signIn', {'email': Bu.email, 'password': PW})[0] == 401, '')
check('other sessions end when the password changes', Bu.req('GET', '/dashboard')[0] == 302, '')
G = User('g'); G.email = Bu.email
check('new password works', pw_signin(G, NEWPW)[0] == 303 and G.req('GET', '/dashboard')[0] == 200, '')
sql(f"update session set created_at = created_at - 3600000 where user_id=(select id from user where email='{Bu.email}')")
st, j = G.action('account.setPassword', {'password': f'later-{RUN}-password'})
check('later, changing the password needs the current one', st == 400 and 'current password' in (j or {}).get('message', ''), f'{st} {j}')
st, j = G.action('account.setPassword', {'password': f'later-{RUN}-password', 'current': NEWPW})
check('with the current password, the change is saved', st == 200, f'{st} {j}')
Bu = User('buyer2'); Bu.email = G.email; pw_signin(Bu, f'later-{RUN}-password')
check('buyer signed back in for the checks below', Bu.req('GET', '/dashboard')[0] == 200, '')
st, j = anon.action('account.setPassword', {'password': 'anything-long-enough'})
check('setPassword signed out -> 401', st == 401, f'{st}')
for path in ('/api/auth/sign-in/email', '/api/auth/sign-up/email', '/api/auth/change-password', '/api/auth/reset-password'):
    st, _, _ = anon.req('POST', path, json.dumps({'email': A.email, 'password': PW}).encode(), {'Content-Type': 'application/json'})
    check(f'raw {path} closed', st == 404, f'{st}')

st, j = D.action('company.invite', {'organizationId': OID, 'email': 'x@example.com'})
check('member (not owner) cannot invite -> 403', st == 403, f'{st}')
st, j = A.action('company.removeMember', {'organizationId': OID, 'userId': sql(f"select id from user where email='{A.email}'")[0]['id']})
check('last owner cannot leave -> 409', st == 409, f'{st}')

# identity check
st, j = A.action('identity.request', {'organizationId': OID, 'registrationNumber': 'U40106PN2019PTC123456', 'registrationCountry': 'IN', 'workEmail': 'asha@sungrid.example'},
    {'document': ('incorporation.pdf', 'application/pdf', PDF)})
check('owner requests identity check', st == 200, f'{st} {j}')
st, j = A.action('identity.request', {'organizationId': OID, 'registrationNumber': 'X123', 'registrationCountry': 'IN', 'workEmail': 'a@b.co'})
check('second pending request -> 409', st == 409, f'{st}')
st, j = D.action('identity.request', {'organizationId': OID, 'registrationNumber': 'X123', 'registrationCountry': 'IN', 'workEmail': 'a@b.co'})
check('non-owner request -> 403', st == 403, f'{st}')
idkey = sql(f"select key from files where organization_id='{OID}' and purpose='identity'")[0]['key']
check('identity document linked to its request', sql(f"select document_key from identity_checks where organization_id='{OID}'")[0]['document_key'] == idkey, '')
check('identity doc hidden from public', anon.req('GET', f'/files/{idkey}')[0] == 404, '')
check('identity doc hidden from other members', Bu.req('GET', f'/files/{idkey}')[0] == 404, '')
check('identity doc visible to own team', D.req('GET', f'/files/{idkey}')[0] == 200, '')
CID = sql(f"select id from identity_checks where organization_id='{OID}'")[0]['id']
st, j = C.action('identity.review', {'checkId': CID, 'decision': 'approved'})
check('non-admin review -> 403', st == 403, f'{st}')
sql(f"update user set role='admin' where email='{C.email}'")
# role is cached in the session cookie for up to 5 minutes; sign in again to pick it up
C2 = User('admin'); C2.email = C.email
C2.form('/signin?_action=account.sendSignInLink', {'email': C2.email}); follow_link(C2, link_in(outbox(C2.email)))
check('admin can open identity doc', C2.req('GET', f'/files/{idkey}')[0] == 200, '')
st, j = C2.action('identity.review', {'checkId': CID, 'decision': 'rejected'})
check('reject without reason -> 400', st == 400, f'{st}')
st, j = C2.action('identity.review', {'checkId': CID, 'decision': 'approved'})
check('admin approves', st == 200, f'{st} {j}')
st, j = C2.action('identity.review', {'checkId': CID, 'decision': 'approved'})
check('decided twice -> 409', st == 409, f'{st}')
st, _, b = anon.req('GET', '/directory?checked=1')
check('checked filter now includes company', OSLUG.encode() in b, '')
st, _, b = anon.req('GET', f'/companies/{OSLUG}')
check('company page shows Identity checked', b'Identity checked' in b, '')

# a rename drops "Identity checked": the mark vouches for the name that was checked
st, j = A.action('company.update', {'organizationId': OID, 'name': f'Sun Grid Labs Renamed {RUN}', 'published': 'on'})
check('renaming a checked company clears the mark', st == 200 and sql(f"select identity_checked_at from organizations where id='{OID}'")[0]['identity_checked_at'] is None, f'{st} {j}')
# outbound email is rate limited
FL = User('flood')
codes = [FL.action('account.sendSignInLink', {'email': FL.email})[0] for _ in range(6)]
check('sign-in links: 5 an hour per address, then 429', codes[:5] == [200] * 5 and codes[5] == 429, str(codes))
# unpublish hides everything
st, j = A.action('company.update', {'organizationId': OID, 'name': f'Sun Grid Labs {RUN}'})
check('unpublished company 404 + gone from search', anon.req('GET', f'/companies/{OSLUG}')[0] == 404 and OSLUG.encode() not in anon.req('GET', '/directory?q=microgrid')[2], '')
st, j = A.action('listings.remove', {'listingId': LID})
check('owner removes listing + its files', st == 200 and not sql(f"select key from files where listing_id='{LID}'"), f'{st}')

# QA round (10 Oct): regressions for what the testers found
T = User('tab'); T.email = A.email
st, h, _ = T.form('/signin?_action=account.signIn', {'email': A.email, 'password': PW, 'next': '/\t/evil.example'})
check('next with a tab cannot leave the site', st == 303 and h['Location'] == '/dashboard', h.get('Location', ''))
T2 = User('nl'); T2.email = A.email
st, h, _ = T2.form('/signin?_action=account.signIn', {'email': A.email, 'password': PW, 'next': '/dashboard\r\nX: 1'})
check('next with a newline: no error, safe fallback', st == 303 and h['Location'] == '/dashboard', f'{st} {h.get("Location")}')
st, _, b = anon.req('GET', '/directory?q=%21%21%21')
check('a search of only punctuation finds nothing (not everyone)', st == 200 and b'class="res"' not in b, f'{st}')
st, j = Bu.action('profile.update', {'name': '​​​'})
check('a name of only zero-width characters is rejected', st == 400, f'{st}')
import threading
cc = []
ts = [threading.Thread(target=lambda: cc.append(Bu.action('company.create', {'name': f'Race Co {RUN}'})[0])) for _ in range(5)]
[t.start() for t in ts]; [t.join() for t in ts]
n_race = sql(f"select count(*) n from organizations where name='Race Co {RUN}'")[0]['n']
check('parallel company creates: no 500, one company', 500 not in cc and n_race == 1, f'{cc} {n_race}')
# an invited person who skips the invitation page still joins the team at setup
I2 = User('skipper')
A.action('company.invite', {'organizationId': OID, 'email': I2.email})
I2.form('/signin?_action=account.sendSignInLink', {'email': I2.email, 'next': '/dashboard'})
follow_link(I2, link_in(outbox(I2.email)))
st, _, b = I2.req('GET', '/welcome')
check('welcome names the team of a pending invitation', st == 200 and b'You are joining' in b, f'{st}')
I2.form('/welcome?_action=account.chooseAccountType', {'name': 'Skip Per', 'password': PW})
row = sql(f"select u.account_type, (select count(*) from members m where m.user_id=u.id and m.organization_id='{OID}') m, (select count(*) from invites i where i.email=u.email and i.accepted_at is not null) acc from user u where u.email='{I2.email}'")[0]
check('setup accepts the pending invitation', row == {'account_type': 'company', 'm': 1, 'acc': 1}, str(row))
st, _, b = Bu.req('GET', '/invite?token=' + 'x' * 30)
check('a dead invitation says so before any click', st == 200 and b'expired or was already used' in b and b'Accept invitation' not in b, f'{st}')
st, _, b = Bu.req('GET', '/admin')
check('/admin for a non-admin is the designed 404 page', st == 404 and b'<html' in b, f'{st} {len(b)}')
st, h, _ = Bu.req('GET', f'/people/{sql(f"select handle from profiles p join user u on u.id=p.user_id where u.email=\'{A.email}\'")[0]["handle"]}')
check('pages rendered for a signed-in member are never cached', 'no-store' in (h.get('Cache-Control') or ''), h.get('Cache-Control', ''))

# remaining P2s (10 Oct)
L2 = A.action('listings.save', {'organizationId': OID, 'name': f'Photo test {RUN}', 'kind': 'product', 'description': 'A listing to test photo removal.', 'status': 'draft'})[1]['id']
A.action('listings.setPhoto', {'listingId': L2}, {'photo': ('p.png', 'image/png', png())})
pk = sql(f"select photo_key from listings where id='{L2}'")[0]['photo_key']
st, j = A.action('listings.removePhoto', {'listingId': L2})
check('listing photo can be removed (row cleared, file gone)', st == 200 and sql(f"select photo_key from listings where id='{L2}'")[0]['photo_key'] is None and anon.req('GET', f'/files/{pk}')[0] == 404, f'{st} {j}')
st, j = Bu.action('listings.removePhoto', {'listingId': L2})
check('listings.removePhoto by outsider -> 404 (same as a missing id)', st == 404, f'{st}')
R = User('reload')
st, h, _ = R.form('/signin?_action=account.sendSignInLink', {'email': R.email, 'next': '/dashboard/profile'})
loc = h.get('Location', '')
check('"Check your email" is a redirect (reload cannot send again), next kept', st == 303 and loc.startswith('/signin?') and 'sent=1' in loc and 'next=%2Fdashboard%2Fprofile' in loc and R.email.split('@')[0] not in loc, loc)
n1 = sql(f"select count(*) n from verification where identifier like '%{R.email}%' or value like '%{R.email}%'")[0]['n']
st, _, b = R.req('GET', loc)
st2, _, b2 = R.req('GET', loc)
n2 = sql(f"select count(*) n from verification where identifier like '%{R.email}%' or value like '%{R.email}%'")[0]['n']
check('the sent page names the address, and reloading sends nothing', st == 200 and R.email.encode() in b and R.email.encode() in b2 and n1 == n2, f'{st} {n1} {n2}')

# --- auth (Grok review, 11 Oct) ---
import threading
sql(f"delete from sign_in_failures where key like '%{A.email}%'")
# 1: dot segments that normalise to a second slash cannot send a member off-site after sign-in
for nxt in ('/.//evil.example', '/foo/..//evil.example'):
    st, h, _ = User('dot').form('/signin?_action=account.signIn', {'email': A.email, 'password': PW, 'next': nxt})
    check(f'next {nxt} cannot leave the site', st == 303 and h.get('Location') == '/dashboard', f'{st} {h.get("Location")}')
# each burst comes from its own network address, so it neither spends nor meets the suite's shared per-address budget
def act_from(u, name, fields, ip):
    return u.req('POST', f'/_actions/{name}', urllib.parse.urlencode(fields).encode(), {'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json', 'cf-connecting-ip': ip})[0]
# 2: limits hold under a burst of parallel requests (count and record are one statement)
PL = User('burst')
pc = []
ts = [threading.Thread(target=lambda: pc.append(act_from(PL, 'account.sendSignInLink', {'email': PL.email}, '198.51.100.31'))) for _ in range(12)]
[t.start() for t in ts]; [t.join() for t in ts]
n_links = sql(f"select count(*) n from verification where identifier like '%{PL.email}%' or value like '%{PL.email}%'")[0]['n']
check('12 parallel link requests: at most 5 sent, the rest 429', pc.count(200) == 5 and pc.count(429) == 7 and n_links <= 5, f'{sorted(pc)} sent={n_links}')
GX = f'guess.{RUN}@example.com'
gc = []
ts = [threading.Thread(target=lambda: gc.append(act_from(User('g'), 'account.signIn', {'email': GX, 'password': 'wrong-password-1'}, '198.51.100.32'))) for _ in range(16)]
[t.start() for t in ts]; [t.join() for t in ts]
n_pair = sql(f"select count(*) n from sign_in_failures where key='pair:{GX}|198.51.100.32'")[0]['n']
check('16 parallel wrong passwords: only 8 are tried, the rest 429', gc.count(401) == 8 and gc.count(429) == 8 and n_pair == 8, f'{sorted(gc)} rows={n_pair}')
# 19: a right password clears the spread-out count for that address too (not the network address count)
def signin_from(ip, password):
    r = urllib.request.Request(B + '/_actions/account.signIn', data=urllib.parse.urlencode({'email': A.email, 'password': password}).encode(), method='POST',
        headers={'Origin': B, 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json', 'cf-connecting-ip': ip})
    try:
        with User('ip').op.open(r) as res: return res.status
    except urllib.error.HTTPError as e: return e.code
signin_from('198.51.100.21', 'wrong-password-1'); signin_from('198.51.100.22', 'wrong-password-1')
before = sql(f"select count(*) n from sign_in_failures where key='email:{A.email}'")[0]['n']
st = signin_from('198.51.100.23', PW)
row = sql(f"select (select count(*) from sign_in_failures where key='email:{A.email}') e, (select count(*) from sign_in_failures where key='pair:{A.email}|198.51.100.21') p, (select count(*) from sign_in_failures where key='ip:198.51.100.21') i, (select count(*) from sign_in_failures where key like '%198.51.100.23') ok")[0]
check('right password clears the address-wide count, keeps the guessers\' own counts, and is not itself a failure', st == 200 and before == 2 and row == {'e': 0, 'p': 1, 'i': 1, 'ok': 0}, f'{st} {before} {row}')
# 3: a revoked session cannot open a private file, even inside the signed cookie's 5 minutes
A3 = User('revoke'); A3.email = A.email
pw_signin(A3, PW)
st1 = A3.req('GET', f'/files/{idkey}')[0]
tok = urllib.parse.unquote(next(c.value for c in A3.jar if c.name.endswith('qe.session_token'))).split('.')[0]
sql(f"delete from session where token='{tok}'")
st2 = A3.req('GET', f'/files/{idkey}')[0]
check('revoked session: private file 404 at once (was 200 before)', st1 == 200 and st2 == 404, f'{st1} {st2}')
# 22: two identity requests sent at once: one waits, the other is refused; two admins deciding at once: one wins
sql(f"update organizations set identity_checked_at=null where id='{OID}'")
ic = []
ts = [threading.Thread(target=lambda: ic.append(A.action('identity.request', {'organizationId': OID, 'registrationNumber': 'U40106PN2019PTC123456', 'registrationCountry': 'IN', 'workEmail': 'asha@sungrid.example'})[0])) for _ in range(5)]
[t.start() for t in ts]; [t.join() for t in ts]
n_pending = sql(f"select count(*) n from identity_checks where organization_id='{OID}' and status='pending'")[0]['n']
check('5 parallel identity requests: one pending, the rest 409', n_pending == 1 and ic.count(200) == 1 and ic.count(409) == 4, f'{sorted(ic)} pending={n_pending}')
CID2 = sql(f"select id from identity_checks where organization_id='{OID}' and status='pending'")[0]['id']
rc = []
ts = [threading.Thread(target=lambda d=d: rc.append((d, C2.action('identity.review', {'checkId': CID2, 'decision': d, 'reason': 'Need the certificate.'})[0]))) for d in ('approved', 'rejected') * 3]
[t.start() for t in ts]; [t.join() for t in ts]
won = [d for d, st in rc if st == 200]
row = sql(f"select c.status, o.identity_checked_at from identity_checks c join organizations o on o.id=c.organization_id where c.id='{CID2}'")[0]
check('6 parallel reviews: one decision wins, the rest 409, company matches it', len(won) == 1 and [st for _, st in rc].count(409) == 5 and row['status'] == won[0] and (row['identity_checked_at'] is not None) == (won[0] == 'approved'), f'{rc} {row}')
# 3: a demoted admin loses private files at once
sql(f"update user set role='member' where email='{C.email}'")
check('demoted admin: private file 404 at once', C2.req('GET', f'/files/{idkey}')[0] == 404, '')
# later checks still need the admin
sql(f"update user set role='admin' where email='{C.email}'")
# 5: admin pages are not advertised: signed out gets the 404 page too, not a sign-in redirect
st, h, b = User('anon2').req('GET', '/admin')
check('/admin signed out is the designed 404 page, no sign-in redirect', st == 404 and b'<html' in b and not h.get('Location'), f'{st} {h.get("Location")}')
# 8: opening an emailed link (a scanner's prefetch) does not spend it; only the Continue button does
ML = User('scanned')
ML.req('POST', '/signin?_action=account.sendSignInLink', urllib.parse.urlencode({'email': ML.email, 'next': '/dashboard'}).encode(), {'Content-Type': 'application/x-www-form-urlencoded', 'cf-connecting-ip': '198.51.100.33'})
mlink = link_in(outbox(ML.email))
check('the emailed link is a page on this site, not the library endpoint', urllib.parse.urlparse(mlink).path == '/signin/link', mlink)
st1, h1, b1 = User('scanner').req('GET', mlink.replace(B, ''))
st2, _, _ = User('scanner2').req('GET', mlink.replace(B, ''))
check('opening the link shows a Continue button, signs nobody in, is not cached', st1 == 200 and st2 == 200 and b'Continue' in b1 and 'no-store' in (h1.get('Cache-Control') or '') and not any(c.startswith('qe.session') for c in (h1.get_all('Set-Cookie') or [])), f'{st1} {st2}')
st, h, _ = follow_link(ML, mlink)
check('after prefetches, Continue still signs in', st == 303 and h.get('Location', '').startswith('/welcome') and ML.req('GET', '/welcome')[0] == 200, f'{st} {h.get("Location")}')
st, h, _ = follow_link(User('again'), mlink)
check('the link works once', st == 303 and h.get('Location') == '/signin?error=link', f'{st} {h.get("Location")}')
st, _, _ = anon.req('GET', '/api/auth/magic-link/verify?' + urllib.parse.urlparse(mlink).query)
check('the library\'s GET verify endpoint is closed', st == 404, f'{st}')
# --- data and permissions (Grok review, 11 Oct) ---
cache = lambda h: h.get('Cache-Control') or ''
CO = {'organizationId': OID, 'name': f'Sun Grid Labs {RUN}', 'website': 'sungrid.example', 'published': 'on'}
# 4: a file is public only while the page that shows it is; until then, only its editors (and admins) get it
A.action('company.update', CO)
A.action('listings.setPhoto', {'listingId': L2}, {'photo': ('d.png', 'image/png', png())})
DPH = sql(f"select photo_key from listings where id='{L2}'")[0]['photo_key']
st, j = A.action('listings.addEvidence', {'listingId': L2}, {'file': ('draft-cert.pdf', 'application/pdf', PDF)})
DEV = j.get('key') if st == 200 else 'x'
codes = [u.req('GET', f'/files/{k}')[0] for u in (anon, Bu) for k in (DEV, DPH)]
check('draft listing photo and evidence: 404 for the public and for outsiders', codes == [404] * 4, str(codes))
st, h, _ = D.req('GET', f'/files/{DEV}')
# the route answers editors "private, max-age=60"; middleware makes any signed-in response "private, no-store"
check('draft listing files: the team (and admins) get them, never from a shared cache', st == 200 and cache(h).startswith('private,') and C2.req('GET', f'/files/{DPH}')[0] == 200, f'{st} {cache(h)}')
A.action('listings.save', {'organizationId': OID, 'listingId': L2, 'name': f'Photo test {RUN}', 'kind': 'product', 'status': 'published'})
st, h, _ = anon.req('GET', f'/files/{DEV}')
check('published listing of a published company: files public, cached 5 minutes (not a year)', st == 200 and cache(h) == 'public, max-age=300' and anon.req('GET', f'/files/{DPH}')[0] == 200, f'{st} {cache(h)}')
A.action('company.update', {k: v for k, v in CO.items() if k != 'published'})
codes = [anon.req('GET', f'/files/{k}')[0] for k in (DEV, DPH, logo)]
check('unpublishing the company hides its listing files and logo again; the owner still gets the logo', codes == [404] * 3 and A.req('GET', f'/files/{logo}')[0] == 200, str(codes))
bphoto = sql(f"select p.photo_key k, p.published p from profiles p join user u on u.id=p.user_id where u.email='{Bu.email}'")[0]
check('photo of an unpublished profile: 404 for others, served to its owner', bphoto['p'] == 0 and anon.req('GET', f"/files/{bphoto['k']}")[0] == 404 and Bu.req('GET', f"/files/{bphoto['k']}")[0] == 200, str(bphoto))
A.action('company.update', CO)
check('logo of a published company stays public and long-cached', anon.req('GET', f'/files/{logo}')[0] == 200 and 'immutable' in cache(anon.req('GET', f'/files/{logo}')[1]), '')

# 6: what "Identity checked" vouches for (name, website), visibility and the logo are the owners' to change
sql(f"update organizations set identity_checked_at = 1700000000000 where id='{OID}'")
codes = [D.action('company.update', f)[0] for f in ({**CO, 'website': 'phish.example'}, {**CO, 'name': 'Hijacked Co'}, {k: v for k, v in CO.items() if k != 'published'})]
row = sql(f"select name, website, published, identity_checked_at c from organizations where id='{OID}'")[0]
check('a member (not owner) cannot change the name, website or visibility -> 403', codes == [403] * 3 and row == {'name': CO['name'], 'website': 'https://sungrid.example/', 'published': 1, 'c': 1700000000000}, f'{codes} {row}')
st, j = D.action('company.update', {**CO, 'description': f'Edited by a teammate {RUN}.'})
row = sql(f"select description, identity_checked_at c from organizations where id='{OID}'")[0]
check('a member can still edit the rest of the page; the mark stays', st == 200 and row == {'description': f'Edited by a teammate {RUN}.', 'c': 1700000000000}, f'{st} {row}')
codes = [D.action('company.setLogo', {'organizationId': OID}, {'logo': ('l.png', 'image/png', png())})[0], D.action('company.removeLogo', {'organizationId': OID})[0]]
check('a member cannot change or remove the logo -> 403', codes == [403, 403], str(codes))
st, _, b = D.req('GET', f'/dashboard/company?org={OID}')
check('company editor: name and website read-only for a member, no logo upload', st == 200 and re.search(rb'<input[^>]*id="c-name"[^>]*readonly', b) and re.search(rb'<input[^>]*id="c-web"[^>]*readonly', b) and b'name="logo"' not in b, f'{st}')
st, j = A.action('company.update', {**CO, 'website': 'sungrid-new.example'})
check('owner changing the website clears "Identity checked"', st == 200 and sql(f"select identity_checked_at c from organizations where id='{OID}'")[0]['c'] is None, f'{st} {j}')

# 7 + 14: a member sees the identity check's status, not what the owner sent; the form post answers 303
st, h, _ = A.form(f'/dashboard/identity?org={OID}&_action=identity.request', {'organizationId': OID, 'registrationNumber': f'REG{RUN}', 'registrationCountry': 'IN', 'workEmail': 'ops@sungrid.example', 'note': f'note {RUN}'})
check('identity request form answers 303', st == 303 and 'flash=identity' in h.get('Location', ''), f'{st} {h.get("Location")}')
st1, _, b1 = D.req('GET', f'/dashboard/identity?org={OID}')
st2, _, b2 = A.req('GET', f'/dashboard/identity?org={OID}')
check('identity page: a member sees the status only; the owner sees what was sent', st1 == 200 and b'In review' in b1 and f'REG{RUN}'.encode() not in b1 and b'ops@sungrid.example' not in b1 and f'note {RUN}'.encode() not in b1 and f'REG{RUN}'.encode() in b2, f'{st1} {st2}')

# 14: successful form posts answer 303 (a 302 after POST may be replayed as a POST)
st1, h1, _ = Bu.form('/dashboard/profile?_action=profile.update', {'name': 'Asha R. Rao'})
st2, h2, _ = A.form(f'/dashboard/company?org={OID}&_action=company.update', {**CO, 'website': 'sungrid-new.example'})
st3, h3, _ = A.form(f'/dashboard/listings/new?org={OID}&_action=listings.save', {'organizationId': OID, 'name': f'Draft only {RUN}', 'kind': 'product', 'status': 'draft'})
L3 = (h3.get('Location') or '').split('?')[0].rsplit('/', 1)[-1]
st4, h4, _ = A.form(f'/dashboard/listings/{L3}?_action=listings.save', {'organizationId': OID, 'listingId': L3, 'name': f'Draft only {RUN}', 'kind': 'product', 'status': 'draft'})
check('profile, company, new listing and listing saves answer 303', [st1, st2, st3, st4] == [303] * 4 and h4.get('Location', '').endswith('?saved=1'), f'{[st1, st2, st3, st4]} {h3.get("Location")}')

# 21: an enquiry can name only a published listing
st, j = Bu.action('enquiries.send', {'organizationId': OID, 'listingId': L3, 'subject': 'About the draft', 'message': 'This names a draft listing by its id, which must not attach.'})
check('an enquiry naming a draft listing -> 404', st == 404, f'{st} {j}')

# 9: opening a thread is a GET and writes nothing; the page posts enquiries.markRead once shown
st, j = Bu.action('enquiries.send', {'organizationId': OID, 'listingId': L2, 'subject': f'Read receipts {RUN}', 'message': 'Checking that opening a thread does not mark it read by itself.'})
E2 = j.get('id') if st == 200 else ''
er = lambda: sql(f"select status, company_unread c, buyer_unread b from enquiries where id='{E2}'")[0]
st, _, b = A.req('GET', f'/dashboard/enquiries/{E2}')
check('team GET of a new thread changes nothing; the page carries the mark-read hook', st == 200 and er() == {'status': 'new', 'c': 1, 'b': 0} and f'data-eq-unread="{E2}"'.encode() in b, f'{st} {er()}')
check('markRead by someone off the thread -> 404', N.action('enquiries.markRead', {'enquiryId': E2})[0] == 404, '')
st, j = D.action('enquiries.markRead', {'enquiryId': E2})
check('markRead by the team: read, and new moves to open', st == 200 and er() == {'status': 'open', 'c': 0, 'b': 0}, f'{st} {er()}')
st, _, b = A.req('GET', f'/dashboard/enquiries/{E2}')
check('a read thread does not ask to be marked again', st == 200 and b'data-eq-unread' not in b, f'{st}')
A.action('enquiries.reply', {'enquiryId': E2, 'body': 'Thanks, noted.'})
Bu.req('GET', f'/dashboard/messages/{E2}')
b_after_get = er()['b']
Bu.action('enquiries.markRead', {'enquiryId': E2})
check("buyer: the GET leaves the reply unread, the page's POST reads it", b_after_get == 1 and er()['b'] == 0, f'{b_after_get} {er()}')

# 10: listing and enquiry ids cannot be probed: someone else's id answers like a missing one
nid = str(uuid.uuid4())
race = sql(f"select o.id from organizations o join members m on m.organization_id=o.id where o.name='Race Co {RUN}'")[0]['id']
pairs = [
    (Bu.action('listings.remove', {'listingId': L2})[0], Bu.action('listings.remove', {'listingId': nid})[0]),
    (Bu.action('listings.setPhoto', {'listingId': L2}, {'photo': ('p.png', 'image/png', png())})[0], Bu.action('listings.setPhoto', {'listingId': nid}, {'photo': ('p.png', 'image/png', png())})[0]),
    (Bu.action('listings.removeEvidence', {'key': DEV})[0], Bu.action('listings.removeEvidence', {'key': 'evidence/none.pdf'})[0]),
    (Bu.action('listings.save', {'organizationId': race, 'listingId': L2, 'name': 'Moved', 'kind': 'product', 'status': 'draft'})[0], Bu.action('listings.save', {'organizationId': race, 'listingId': nid, 'name': 'Moved', 'kind': 'product', 'status': 'draft'})[0]),
    (N.action('enquiries.setStatus', {'enquiryId': E2, 'status': 'closed'})[0], N.action('enquiries.setStatus', {'enquiryId': nid, 'status': 'closed'})[0]),
]
check('another company\'s listing or enquiry id answers 404, like a missing one', pairs == [(404, 404)] * 5, str(pairs))

# 11: a save rewrites its search rows in the same batch: one row per live entity, none once hidden
cnt = lambda eid: sql(f"select count(*) n from search where entity_id='{eid}'")[0]['n']
check('search: one row for the live company and its live listing, none for the draft', (cnt(OID), cnt(L2), cnt(L3)) == (1, 1, 0), str((cnt(OID), cnt(L2), cnt(L3))))
ts = [threading.Thread(target=lambda i=i: A.action('company.update', {**CO, 'website': 'sungrid-new.example', 'description': f'Parallel save {i}.'})) for i in range(4)]
[t.start() for t in ts]; [t.join() for t in ts]
check('parallel company saves leave one search row each', (cnt(OID), cnt(L2)) == (1, 1), str((cnt(OID), cnt(L2))))
st, _, b = anon.req('GET', '/directory?q=parallel')
check('directory finds the company by the text saved with it', st == 200 and OSLUG.encode() in b, f'{st}')
A.action('company.update', {'organizationId': OID, 'name': CO['name'], 'website': 'sungrid-new.example'})
check('unpublishing removes the company and its listings from search in the same save', (cnt(OID), cnt(L2)) == (0, 0), str((cnt(OID), cnt(L2))))
A.action('company.update', {**CO, 'website': 'sungrid-new.example'})

# 12: enquiry lists are read a page at a time
sql(f"""WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 55)
  INSERT INTO enquiries (id, organization_id, from_name, from_email, subject, status, company_unread, buyer_unread, created_at, updated_at)
  SELECT 'bulk-{RUN}-' || i, '{OID}', 'Bulk Sender', 'bulk@example.com', 'Bulk ' || i, 'open', 0, 0, 1000 + i, 1000 + i FROM n""")
n_open = sql(f"select count(*) n from enquiries where organization_id='{OID}' and status != 'closed'")[0]['n']
st, _, b = A.req('GET', f'/dashboard/enquiries?org={OID}')
st2, _, b2 = A.req('GET', f'/dashboard/enquiries?org={OID}&page=2')
check('company inbox: 50 a page, an Older link, the next page, and the full open count', st == 200 and b.count(b'class="eq-item') == 50 and b'page=2' in b and b2.count(b'class="eq-item') == n_open - 50 and f'Open<i>{n_open}</i>'.encode() in b, f'{st} {b.count(b"class=\"eq-item")} {b2.count(b"class=\"eq-item")} {n_open}')

# 18: the LinkedIn field takes linkedin.com addresses only
st1, j1 = Bu.action('profile.update', {'name': 'Asha R. Rao', 'linkedin': 'https://evil.example/in/asha'})
st2, j2 = A.action('company.update', {**CO, 'website': 'sungrid-new.example', 'linkedin': 'linkedin.com.evil.example/company/x'})
st3, j3 = Bu.action('profile.update', {'name': 'Asha R. Rao', 'linkedin': 'linkedin.com/in/asha-rao'})
li = sql(f"select p.linkedin from profiles p join user u on u.id=p.user_id where u.email='{Bu.email}'")[0]['linkedin']
check('LinkedIn fields take linkedin.com addresses only, with a plain message', st1 == 400 and st2 == 400 and 'LinkedIn address' in json.dumps(j1) and st3 == 200 and li == 'https://linkedin.com/in/asha-rao', f'{st1} {st2} {st3} {li}')

# enquiries: 10 a day per sender, counted by the shared throttle (one statement per send)
codes = [N.action('enquiries.send', {'organizationId': OID, 'subject': f'Cap {i}', 'message': 'Checking the daily cap on enquiries from one member.'})[0] for i in range(11)]
check('enquiries: 10 a day per sender, then 429', codes == [200] * 10 + [429], str(codes))

# --- QA defects (11 Oct) ---
import html as _html
CO_NAME = sql(f"select name from organizations where id='{OID}'")[0]['name']
A.action('company.update', {**CO, 'name': CO_NAME})
Q = User('qa')
check('QA: a fresh member signs in', login(Q, 'individual'))
st, j = Q.action('enquiries.send', {'organizationId': OID, 'subject': 'Local time check', 'message': 'Checking that the times show in the reader zone.'})
QEQ = j.get('id') if st == 200 and isinstance(j, dict) else ''
# 2: every enquiry date is a <time> with its instant, which the page's script redoes in the reader's zone
st, _, b = A.req('GET', f'/dashboard/enquiries/{QEQ}')
check('QA 2: thread and list dates are <time datetime> the page localises', st == 200 and re.search(rb'<time datetime="[0-9T:.\-]+Z" data-local="msg">', b) is not None
      and re.search(rb'<time datetime="[0-9T:.\-]+Z" data-local="day">', b) is not None, f'{st}')
st, _, b = Q.req('GET', '/dashboard/messages')
check('QA 2: the sent list dates are <time datetime> too', st == 200 and b'data-local="day"' in b, f'{st}')
# 7: the thread being opened does not count in its own page's badge (company and buyer side)
def badge(body, label): m = re.search(label.encode() + rb'<span class="n">(\d+)<', body); return int(m.group(1)) if m else 0
before = badge(A.req('GET', '/dashboard/enquiries')[2], 'Enquiries')
QEQ2 = Q.action('enquiries.send', {'organizationId': OID, 'subject': 'Badge check', 'message': 'One more to check the badge count on the thread.'})[1].get('id')
listed = badge(A.req('GET', '/dashboard/enquiries')[2], 'Enquiries')
on_thread = badge(A.req('GET', f'/dashboard/enquiries/{QEQ2}')[2], 'Enquiries')
check('QA 7: company badge leaves out the open thread', listed == before + 1 and on_thread == listed - 1, f'{before} {listed} {on_thread}')
A.action('enquiries.reply', {'enquiryId': QEQ2, 'body': 'Thanks, we will look at it.'})
b1 = badge(Q.req('GET', '/dashboard')[2], 'Sent enquiries')
b2 = badge(Q.req('GET', f'/dashboard/messages/{QEQ2}')[2], 'Sent enquiries')
check('QA 7: buyer badge leaves out the open thread', b1 >= 1 and b2 == b1 - 1, f'{b1} {b2}')
# 3: an input error on a field the form does not show still says something
st, _, b = Q.form(f'/companies/{OSLUG}/enquire?_action=enquiries.send', {'organizationId': 'not-a-uuid', 'listingId': '', 'subject': 'Hidden field', 'message': 'A message long enough to pass the length check.'})
check('QA 3: hidden-field error shows "Check the form and try again."', st == 400 and b'Check the form and try again.' in b, f'{st}')
# 5: sign-in by link shows the action's own message, not a fixed one
# from its own network address, so it does not spend the suite's shared per-address link budget
L = User('links')
lform = lambda: L.req('POST', '/signin?by=link&_action=account.sendSignInLink', urllib.parse.urlencode({'email': L.email, 'next': ''}).encode(),
                      {'Content-Type': 'application/x-www-form-urlencoded', 'cf-connecting-ip': '198.51.100.41'})
for _ in range(5): lform()
st, _, b = lform()
check('QA 5: sign-in link error shows the real reason', st == 429 and b'Too many links asked for' in b and b'Try again in a minute' not in b, f'{st}')
# 6: skills keep the member's capitals; repeats are dropped whatever their case
st, j = Q.action('profile.update', {'name': 'Quinn Test', 'skills': 'PV design, ESG , pv  design, esg'})
qskills = sorted(r['value'] for r in sql(f"select t.value from tags t join profiles p on p.id=t.entity_id join user u on u.id=p.user_id where u.email='{Q.email}' and t.kind='skill'"))
check('QA 6: skills keep their capitals, deduped case-insensitively', st == 200 and qskills == ['ESG', 'PV design'], f'{st} {qskills}')
# 9: company size options do not overlap
st, _, b = A.req('GET', '/dashboard/company')
check('QA 9: size options 201–999 and 1,000+', st == 200 and '201–999'.encode() in b and '201–1,000'.encode() not in b and b'value="201-1000"' in b, f'{st}')
# 10: a signed-out invitee keeps the invitation on sign-in and sign-up; sign-up skips the type doors
V = User('invitee')
A.action('company.invite', {'organizationId': OID, 'email': V.email})
vpath = link_in(outbox(V.email)).replace(B, '')
q = urllib.parse.quote(vpath, safe='')
line = re.compile(rb'You were invited to join <b[^>]*>' + re.escape(_html.escape(CO_NAME).encode()) + rb'</b>')
st1, _, b1 = V.req('GET', f'/signin?next={q}')
st2, _, b2 = V.req('GET', f'/join?next={q}')
st3, _, b3 = V.req('GET', '/join')
check('QA 10: sign-in and sign-up name the inviting company', st1 == 200 and line.search(b1) and st2 == 200 and line.search(b2) and not line.search(b3), f'{st1} {st2} {st3}')
check('QA 10: sign-up skips the type doors for an invitee only', b'name="type"' not in b2 and b'name="type"' in b3, '')
st, h, _ = V.req('POST', '/join?_action=account.sendSignInLink', urllib.parse.urlencode({'name': 'Vera Invitee', 'email': V.email, 'next': vpath}).encode(),
                 {'Content-Type': 'application/x-www-form-urlencoded', 'cf-connecting-ip': '198.51.100.42'})
st2, h2, _ = follow_link(V, link_in(outbox(V.email)))
check('QA 10: an invitee joins without a type and lands on the invitation', st == 303 and st2 == 303 and h2['Location'].endswith(vpath), f'{st} {st2} {h2.get("Location")}')
# password page: it asks for the current password exactly when the action demands it
st, _, b = Q.req('GET', '/dashboard/password')
fresh_ok = st == 200 and b'name="current"' not in b
sql(f"update session set created_at = created_at - 20*60*1000 where user_id=(select id from user where email='{Q.email}')")
st, _, b = Q.req('GET', '/dashboard/password')
st2, j2 = Q.action('account.setPassword', {'password': f'qa-{RUN}-password'})
check('QA password: field shown exactly when the action needs it (fresh: no; after 15 min: yes)', fresh_ok and st == 200 and b'name="current"' in b and st2 == 400 and 'current password' in (j2 or {}).get('message', ''), f'{st} {st2}')
# 14: hidden pages: the team (and admins) and the profile's owner get a preview; everyone else the 404
A.action('company.update', {k: v for k, v in CO.items() if k != 'published'} | {'name': CO_NAME})
st1, h1, b1 = A.req('GET', f'/companies/{OSLUG}')
st2 = D.req('GET', f'/companies/{OSLUG}')[0]
st3 = Q.req('GET', f'/companies/{OSLUG}')[0]
st4 = User('anon').req('GET', f'/companies/{OSLUG}')[0]
check('QA 14: hidden company: team preview with notice, no-store, noindex; others 404', st1 == 200 and b'Only your team can see this page until you publish it.' in b1 and 'no-store' in h1.get('Cache-Control', '')
      and b'noindex' in b1 and st2 == 200 and st3 == 404 and st4 == 404, f'{st1} {st2} {st3} {st4}')
A.action('company.update', {**CO, 'name': CO_NAME})
qhandle = sql(f"select p.handle from profiles p join user u on u.id=p.user_id where u.email='{Q.email}'")[0]['handle']
st1, h1, b1 = Q.req('GET', f'/people/{qhandle}')
st2 = A.req('GET', f'/people/{qhandle}')[0]
st3 = User('anon').req('GET', f'/people/{qhandle}')[0]
check('QA 14: hidden profile: owner preview with notice, no-store, noindex; others 404', st1 == 200 and b'Only you can see this page until you publish it.' in b1 and 'no-store' in h1.get('Cache-Control', '')
      and b'noindex' in b1 and st2 == 404 and st3 == 404, f'{st1} {st2} {st3}')

fails = [r for r in results if r[1] == 'FAIL']
print(f'\n{len(results) - len(fails)}/{len(results)} passed')
sys.exit(1 if fails else 0)
