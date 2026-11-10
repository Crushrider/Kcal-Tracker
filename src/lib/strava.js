import { load, save } from './storage.js';

const TOKEN_KEY = 'strava-token';

export function getStravaToken() {
  return load(TOKEN_KEY, null);
}

export function saveStravaToken(token) {
  save(TOKEN_KEY, token);
}

export function clearStravaToken() {
  save(TOKEN_KEY, null);
}

export async function exchangeCode(code, clientId, clientSecret, redirectUri) {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    })
  });
  if (!res.ok) throw new Error(`Strava token-fout (${res.status})`);
  return res.json();
}

async function refreshAccessToken(token, clientId, clientSecret) {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: token.refresh_token
    })
  });
  if (!res.ok) throw new Error(`Strava refresh-fout (${res.status})`);
  return res.json();
}

export async function getValidToken(clientId, clientSecret) {
  let token = getStravaToken();
  if (!token) throw new Error('Strava niet gekoppeld.');
  if (token.expires_at && token.expires_at * 1000 < Date.now() + 60000) {
    token = await refreshAccessToken(token, clientId, clientSecret);
    saveStravaToken(token);
  }
  return token;
}

export async function fetchActivities(token, afterEpoch, beforeEpoch) {
  const perPage = 100;
  let page = 1;
  const all = [];
  while (true) {
    const url =
      `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&page=${page}` +
      (afterEpoch ? `&after=${afterEpoch}` : '') +
      (beforeEpoch ? `&before=${beforeEpoch}` : '');
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token.access_token}` }
    });
    if (!res.ok) throw new Error(`Strava API fout (${res.status})`);
    const batch = await res.json();
    all.push(...batch);
    if (batch.length < perPage) break;
    page++;
  }
  return all;
}

export const activityKcal = (a) => a.kilojoules ? a.kilojoules / 4.184 : a.calories || 0;

export const isSportActivity = (a) => ['Run', 'Ride', 'Swim', 'Walk', 'Hike', 'WeightTraining', 'Workout', 'Yoga'].includes(a.type);
