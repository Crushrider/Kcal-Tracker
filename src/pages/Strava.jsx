import React, { useEffect, useState } from 'react';
import {
  getStravaToken,
  exchangeCode,
  getValidToken,
  fetchActivities,
  activityKcal,
  isSportActivity
} from '../lib/strava.js';
import { setBurnEntriesForWeek } from '../lib/entries.js';
import { weekStart, addDays, isoDate } from '../lib/storage.js';

export default function Strava({ settings, onChanged }) {
  const token = getStravaToken();
  const [status, setStatus] = useState(token ? 'Gekoppeld ✅' : 'Niet gekoppeld');
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (code && state === 'strava') {
      exchangeCode(code, settings.stravaClientId, settings.stravaClientSecret, location.origin + '/?strava_connected=1')
        .then(() => {
          setStatus('Gekoppeld ✅');
          history.replaceState(null, '', location.pathname);
        })
        .catch((e) => setError(e.message));
    }
  }, []);

  function connect() {
    if (!settings.stravaClientId) {
      setError('Vul eerst je Strava Client ID in onder Instellingen.');
      return;
    }
    const url =
      `https://www.strava.com/oauth/mobile/authorize?` +
      `client_id=${settings.stravaClientId}` +
      `&redirect_uri=${encodeURIComponent(location.origin + '/?strava_connected=1')}` +
      `&scope=read,activity:read_all&state=strava&response_type=code&approval_prompt=auto`;
    location.href = url;
  }

  async function syncWeek() {
    setError('');
    setSyncing(true);
    try {
      const t = await getValidToken(settings.stravaClientId, settings.stravaClientSecret);
      const start = weekStart(isoDate());
      const end = addDays(start, 6);
      const activities = await fetchActivities(
        t,
        Math.floor(new Date(start + 'T00:00:00').getTime() / 1000),
        Math.floor(new Date(end + 'T23:59:59').getTime() / 1000)
      );
      const sport = activities.filter(isSportActivity);
      const perDay = {};
      sport.forEach((a) => {
        const day = a.start_date_local.slice(0, 10);
        perDay[day] = (perDay[day] || 0) + Math.round(activityKcal(a));
      });
      setBurnEntriesForWeek(start, Object.keys(perDay), perDay);
      setStatus(`Gekoppeld ✅ — ${sport.length} activiteiten deze week gesynchroniseerd`);
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <section>
      <div className="card">
        <h3>🚴 Strava-koppeling</h3>
        <p className="muted">{status}</p>
        {error && <p className="error">{error}</p>}
        <div className="row">
          {!token && <button className="primary" onClick={connect}>Koppel Strava</button>}
          <button onClick={syncWeek} disabled={syncing || !token}>
            {syncing ? 'Synchroniseren…' : 'Synchroniseer deze week'}
          </button>
        </div>
        <p className="muted small">
          Verbrande calorieën uit Strava-activiteiten worden per dag opgeslagen en gebruikt in je weekrapport.
        </p>
      </div>
    </section>
  );
}
