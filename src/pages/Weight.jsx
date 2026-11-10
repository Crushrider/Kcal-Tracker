import React, { useEffect, useState } from 'react';
import {
  getWithingsToken,
  exchangeCode,
  fetchLatestMeasures,
  measuresToWeights
} from '../lib/withings.js';
import { addWeightEntry, getWeightEntries } from '../lib/entries.js';
import { isoDate } from '../lib/storage.js';

export default function Weight({ settings, onChanged }) {
  const token = getWithingsToken();
  const [status, setStatus] = useState(token ? 'Gekoppeld ✅' : 'Niet gekoppeld');
  const [error, setError] = useState('');
  const [manual, setManual] = useState({ date: isoDate(), kg: '' });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (code && state === 'withings') {
      exchangeCode(code, settings.withingsClientId, settings.withingsClientSecret, location.origin + '/?withings_connected=1')
        .then(() => {
          setStatus('Gekoppeld ✅');
          history.replaceState(null, '', location.pathname);
        })
        .catch((e) => setError(e.message));
    }
  }, []);

  function connect() {
    if (!settings.withingsClientId) {
      setError('Vul eerst je Withings Client ID in onder Instellingen.');
      return;
    }
    const url =
      `https://account.withings.com/oauth2_user/authorize2?` +
      `client_id=${settings.withingsClientId}` +
      `&redirect_uri=${encodeURIComponent(location.origin + '/?withings_connected=1')}` +
      `&scope=user.metrics&state=withings&response_type=code`;
    location.href = url;
  }

  async function sync() {
    setError('');
    setSyncing(true);
    try {
      const grps = await fetchLatestMeasures(token);
      const weights = measuresToWeights(grps);
      weights.forEach((w) => addWeightEntry(isoDate(w.date), Number(w.kg.toFixed(2)), 'withings'));
      setStatus(`Gekoppeld ✅ — ${weights.length} metingen opgehaald`);
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  }

  function saveManual() {
    if (!manual.kg) return;
    addWeightEntry(manual.date, Number(manual.kg), 'manual');
    setManual({ ...manual, kg: '' });
    onChanged();
  }

  const entries = Object.entries(getWeightEntries()).sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <section>
      <div className="card">
        <h3>⚖️ Slimme weegschaal (Withings)</h3>
        <p className="muted">{status}</p>
        {error && <p className="error">{error}</p>}
        <div className="row">
          {!token && <button className="primary" onClick={connect}>Koppel Withings</button>}
          <button onClick={sync} disabled={syncing || !token}>
            {syncing ? 'Synchroniseren…' : 'Metingen ophalen'}
          </button>
        </div>
      </div>

      <div className="card">
        <h3>✍️ Handmatig wegen</h3>
        <label>
          Datum
          <input type="date" value={manual.date} onChange={(e) => setManual({ ...manual, date: e.target.value })} />
        </label>
        <input
          type="number"
          step="0.1"
          placeholder="Gewicht in kg"
          value={manual.kg}
          onChange={(e) => setManual({ ...manual, kg: e.target.value })}
        />
        <button className="primary" onClick={saveManual}>Opslaan</button>
      </div>

      <div className="card">
        <h3>Geschiedenis</h3>
        {entries.length === 0 ? (
          <p className="muted">Nog geen metingen.</p>
        ) : (
          <ul className="list">
            {entries.map(([d, e]) => (
              <li key={d}>
                <span>{d} {e.source === 'withings' ? '📶' : '✍️'}</span>
                <b>{e.kg.toFixed(1)} kg</b>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
