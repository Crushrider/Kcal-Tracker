import { load, save } from './storage.js';

const TOKEN_KEY = 'withings-token';

export function getWithingsToken() {
  return load(TOKEN_KEY, null);
}

export function saveWithingsToken(token) {
  save(TOKEN_KEY, token);
}

export function clearWithingsToken() {
  save(TOKEN_KEY, null);
}

export async function exchangeCode(code, clientId, clientSecret, redirectUri) {
  const res = await fetch('https://wbsapi.withings.net/v2/oauth2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      action: 'requesttoken',
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    })
  });
  const data = await res.json();
  if (data.status !== 0) throw new Error(`Withings fout (${data.status}): ${data.error}`);
  return data.body;
}

export async function fetchLatestMeasures(token) {
  const res = await fetch('https://wbsapi.withings.net/measure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      action: 'getmeas',
      access_token: token.access_token,
      meastype: '1',
      category: '1',
      limit: '100'
    })
  });
  const data = await res.json();
  if (data.status !== 0) throw new Error(`Withings meet-fout (${data.status})`);
  return data.body.measuregrps ?? [];
}

export function measuresToWeights(grps) {
  return grps
    .map((g) => {
      const m = g.measures?.find((x) => x.type === 1);
      return m ? { date: new Date(g.date * 1000), kg: m.value * 10 ** m.unit } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date);
}
