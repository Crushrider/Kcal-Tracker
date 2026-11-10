import React, { useEffect, useState } from 'react';
import {
  getGoogleFitToken,
  buildAuthUrl,
  exchangeCode,
  getValidToken,
  fetchWeights
} from '../lib/googlefit.js';
import { addWeightEntry, getWeightEntries } from '../lib/entries.js';
import { isoDate } from '../lib/storage.js';

export default function Weight({ settings, onChanged }) {
  const token = getGoogleFitToken();
  const [status, setStatus] = useState(token ? 'Gekoppeld ✅' : 'Niet gekoppeld');
  const [error, setError] = useState('');
  const [manual, setManual] = useState({ date: isoDate(), kg: '' });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (code && state === 'googlefit') {
      exchangeCode(code, settings.googleClientId, settings.googleClientSecret, location.origin + '/?weight_connected=1')
        .then(() => {
          setStatus('Gekoppeld ✅');
          history.replaceState(null, '', location.pathname);
        })
        .catch((e) => setError(e.message));
    }
  }, []);

  function connect() {
    if (!settings.googleClientId) {
      setError('Vul eerst je Google OAuth Client ID in onder Instellingen.');
      return;
    }
    location.href = buildAuthUrl(settings.googleClientId, location.origin + '/?weight_connected=1');
  }

  async function sync() {
    setError('');
    setSyncing(true);
    try {
      const t = await getValidToken(settings.googleClientId, settings.googleClientSecret);
      const endMs = Date.now();
      const startMs = endMs - 90 * 86400000;
      const weights = await fetchWeights(t, startMs, endMs);
      weights.forEach((w) => addWeightEntry(isoDate(w.date), Number(w.kg.toFixed(2)), 'googlefit'));
      setStatus(
        weights.length
          ? `Gekoppeld ✅ — ${weights.length} metingen (laatste 90 dagen) opgehaald`
          : 'Gekoppeld ✅, maar geen gewichtsmetingen gevonden. Zet in de FITAGE-app "Google Fit / Health Connect" aan.'
      );
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
        <h3>📶 Automatisch gewicht via Google Fit</h3>
        <p className="muted">
          De FITAGE-app heeft geen eigen API, maar synchroniseert naar Google Fit.
          Zet in de FITAGE-app <b>Google Fit / Health Connect</b> aan, koppel hieronder je Google-account,
          en je gewichtsmetingen worden automatisch opgehaald.
        </p>
        <p className="muted">{status}</p>
        {error && <p className="error">{error}</p>}
        <div className="row">
          {!token && <button className="primary" onClick={connect}>Koppel Google Fit</button>}
          <button onClick={sync} disabled={syncing || !token}>
            {syncing ? 'Synchroniseren…' : 'Metingen ophalen (90 dagen)'}
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
                <span>{d} {e.source === 'googlefit' ? '📶' : '✍️'}</span>
                <b>{e.kg.toFixed(1)} kg</b>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
