import { load, save } from './storage.js';

const TOKEN_KEY = 'googlefit-token';

export function getGoogleFitToken() {
  return load(TOKEN_KEY, null);
}

export function saveGoogleFitToken(token) {
  save(TOKEN_KEY, token);
}

export function clearGoogleFitToken() {
  save(TOKEN_KEY, null);
}

export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const SCOPE = 'https://www.googleapis.com/auth/fitness.body.read';

export function buildAuthUrl(clientId, redirectUri) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state: 'googlefit'
  });
  return `${GOOGLE_AUTH_URL}?${params}`;
}

export async function exchangeCode(code, clientId, clientSecret, redirectUri) {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri
  });
  if (clientSecret) body.set('client_secret', clientSecret);

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!res.ok) throw new Error(`Google OAuth fout (${res.status}): ${await res.text()}`);
  return res.json();
}

async function refreshAccessToken(token, clientId, clientSecret) {
  const body = new URLSearchParams({
    refresh_token: token.refresh_token,
    client_id: clientId,
    grant_type: 'refresh_token'
  });
  if (clientSecret) body.set('client_secret', clientSecret);

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!res.ok) throw new Error(`Google token-vernieuwing mislukt (${res.status})`);
  return res.json();
}

export async function getValidToken(clientId, clientSecret) {
  let token = getGoogleFitToken();
  if (!token) throw new Error('Google Fit niet gekoppeld.');
  const expiresAt = (token.expires_at ?? 0) * 1000;
  if (expiresAt < Date.now() + 60000) {
    const refreshed = await refreshAccessToken(token, clientId, clientSecret);
    token = { ...token, ...refreshed, expires_at: Math.floor(Date.now() / 1000) + refreshed.expires_in };
    saveGoogleFitToken(token);
  }
  return token;
}

export async function fetchWeights(token, startMs, endMs) {
  const res = await fetch(
    'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        aggregateBy: [{ dataTypeName: 'com.google.weight' }],
        startTimeMillis: startMs,
        endTimeMillis: endMs,
        bucketByTime: { durationMillis: 86400000 }
      })
    }
  );
  if (!res.ok) throw new Error(`Google Fit API fout (${res.status})`);
  const data = await res.json();
  const out = [];
  for (const bucket of data.bucket ?? []) {
    for (const ds of bucket.dataset ?? []) {
      for (const p of ds.point ?? []) {
        const kg = p.value?.[0]?.fpVal;
        if (kg != null) {
          out.push({ date: new Date(Number(p.startTimeMillis)), kg });
        }
      }
    }
  }
  return out.sort((a, b) => a.date - b.date);
}
