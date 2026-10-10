// Password hashing with PBKDF2-SHA256 from WebCrypto. The login library's default (scrypt in JavaScript) costs
// far more CPU than a Worker request may use; native PBKDF2 at 100,000 rounds (the Workers maximum) takes about 8 ms.
// Stored as "pbkdf2-sha256$<rounds>$<salt>$<hash>", base64, so the rounds can rise later without breaking old hashes.
const ROUNDS = 100_000;
const enc = new TextEncoder();
const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const unb64 = (s: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, rounds: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password.normalize('NFKC')), 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: rounds }, key, 256));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2-sha256$${ROUNDS}$${b64(salt)}$${b64(await derive(password, salt, ROUNDS))}`;
}

export async function verifyPassword({ hash, password }: { hash: string; password: string }): Promise<boolean> {
  const [scheme, rounds, salt, want] = hash.split('$');
  if (scheme !== 'pbkdf2-sha256' || !rounds || !salt || !want) return false;
  const n = Number(rounds);
  if (!Number.isInteger(n) || n < 1 || n > ROUNDS) return false;
  const got = await derive(password, unb64(salt), n);
  const exp = unb64(want);
  if (got.length !== exp.length) return false;
  // compare every byte, so the time taken says nothing about where a guess went wrong
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got[i]! ^ exp[i]!;
  return diff === 0;
}
