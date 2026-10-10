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

def sql(q):
    cmd = ['pnpm', '-s', 'wrangler', 'd1', 'execute', 'quintaearth', '--local', '--json', '--command', q] + (['--persist-to', PERSIST] if PERSIST else [])
    out = subprocess.run(cmd, cwd=REPO, capture_output=True, text=True).stdout
    return json.loads(out)[0]['results']

def login(u, kind, company=''):
    u.form('/signin?_action=account.sendSignInLink', {'email': u.email, 'next': '/dashboard'})
    st, h, _ = u.req('GET', link_in(outbox(u.email)).replace(B, ''))
    st, h, _ = u.form('/welcome?_action=account.chooseAccountType', {'name': u.email.split('.')[0].title() + ' Test', 'type': kind, 'company': company, 'password': PW})
    return st == 302 and h['Location'].endswith('/dashboard')

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
W.req('GET', link_in(outbox(W.email)).replace(B, ''))
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
st, j = Bu.action('profile.update', {'name': 'Asha Rao', 'industries': ['not-an-industry']})
check('profile.update rejects unknown industry', st == 400, f'{st}')
st, j = Bu.action('profile.update', {'name': 'Asha Rao', 'website': 'javascript:alert(1)'})
check('profile.update rejects javascript: url', st == 400, f'{st}')
row = sql(f"select p.website, (select group_concat(value) from tags where entity_id=p.id and kind='skill') skills from profiles p where handle='{handle}'")[0]
check('profile url normalised + skills deduped', row['website'] == 'https://asha.example.com/' and row['skills'].count('solar pv') == 1, str(row))
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
check('listings.remove by outsider -> 403', st == 403, f'{st}')
st, j = Bu.action('listings.removeEvidence', {'key': EVID})
check('listings.removeEvidence by outsider -> 403', st == 403, f'{st}')

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
st, _, b = anon.req('GET', '/directory?sdg=7&country=IN&industry=energy')
check('directory tag filters', OSLUG.encode() in b and handle.encode() in b, '')
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
check('buyer cannot close company thread -> 403', st == 403, f'{st}')
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
st, h, _ = E.req('GET', link_in(outbox(E.email)).replace(B, ''))
check('new member lands back on the invitation', st == 302 and h['Location'].endswith(inv_path), h.get('Location', ''))
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
N.req('GET', link_in(outbox(N.email)).replace(B, ''))
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
S.req('GET', link_in(outbox(S.email)).replace(B, ''))
st, j = S.action('account.chooseAccountType', {'name': 'Short Pw', 'type': 'individual', 'password': 'short'})
check('new member: password under 10 characters -> 400, account not set up', st == 400 and sql(f"select account_type from user where email='{S.email}'")[0]['account_type'] is None, f'{st}')
# forgotten password: the email link signs in once and lands on the password page
F = User('forgot'); F.email = Bu.email
F.form('/signin?_action=account.sendSignInLink', {'email': F.email, 'next': '/dashboard/messages'})
st, h, _ = F.req('GET', link_in(outbox(F.email)).replace(B, ''))
loc = urllib.parse.urlparse(h.get('Location', ''))
check('email link for a known member lands on the password page', st == 302 and loc.path == '/dashboard/password' and urllib.parse.parse_qs(loc.query).get('next') == ['/dashboard/messages'], h.get('Location', ''))
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
C2.form('/signin?_action=account.sendSignInLink', {'email': C2.email}); C2.req('GET', link_in(outbox(C2.email)).replace(B, ''))
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
I2.req('GET', link_in(outbox(I2.email)).replace(B, ''))
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
check('listings.removePhoto by outsider -> 403', st == 403, f'{st}')
R = User('reload')
st, h, _ = R.form('/signin?_action=account.sendSignInLink', {'email': R.email, 'next': '/dashboard/profile'})
loc = h.get('Location', '')
check('"Check your email" is a redirect (reload cannot send again), next kept', st == 303 and loc.startswith('/signin?') and 'sent=1' in loc and 'next=%2Fdashboard%2Fprofile' in loc and R.email.split('@')[0] not in loc, loc)
n1 = sql(f"select count(*) n from verification where identifier like '%{R.email}%' or value like '%{R.email}%'")[0]['n']
st, _, b = R.req('GET', loc)
st2, _, b2 = R.req('GET', loc)
n2 = sql(f"select count(*) n from verification where identifier like '%{R.email}%' or value like '%{R.email}%'")[0]['n']
check('the sent page names the address, and reloading sends nothing', st == 200 and R.email.encode() in b and R.email.encode() in b2 and n1 == n2, f'{st} {n1} {n2}')

fails = [r for r in results if r[1] == 'FAIL']
print(f'\n{len(results) - len(fails)}/{len(results)} passed')
sys.exit(1 if fails else 0)
