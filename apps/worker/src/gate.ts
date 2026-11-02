export const SESSION_TTL_SECONDS = 900;
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** True only for a token Cloudflare accepts, issued on one of our own hostnames. */
export async function verifyTurnstile(
  token: string,
  ip: string | undefined,
  env: Env,
): Promise<boolean> {
  try {
    const form = new FormData();
    form.set('secret', env.TURNSTILE_SECRET ?? '');
    form.set('response', token);
    if (ip) form.set('remoteip', ip);
    const res = await fetch(SITEVERIFY, { method: 'POST', body: form });
    const result = (await res.json()) as { success?: boolean; hostname?: string };
    const hostnames = env.ALLOWED_ORIGIN.split(',').map(origin => new URL(origin).hostname);
    return result.success === true && hostnames.includes(result.hostname ?? '');
  } catch {
    return false;
  }
}

async function sign(secret: string, payload: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload)));
}

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

/** `${expiresAtSeconds}.${signature}`: stateless, so any isolate can verify it. */
export async function issueSession(
  secret: string,
  now = Math.floor(Date.now() / 1000),
): Promise<string> {
  const expires = String(now + SESSION_TTL_SECONDS);
  return `${expires}.${toBase64Url(await sign(secret, expires))}`;
}

export async function verifySession(
  token: string,
  secret: string,
  now = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  const [expires, signature, ...extra] = token.split('.');
  if (!expires || !signature || extra.length > 0 || !/^\d+$/.test(expires)) return false;
  if (now >= Number(expires)) return false;

  // Re-encoding the expected signature keeps this to equal-length strings, so a
  // malformed one just fails the comparison instead of throwing.
  const expected = new TextEncoder().encode(toBase64Url(await sign(secret, expires)));
  const given = new TextEncoder().encode(signature);
  return expected.length === given.length && crypto.subtle.timingSafeEqual(expected, given);
}
