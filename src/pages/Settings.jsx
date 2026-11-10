import React, { useState } from 'react';
import { getSettings, updateSettings } from '../lib/settings.js';

export default function Settings({ onSaved }) {
  const [form, setForm] = useState(getSettings());

  function submit(e) {
    e.preventDefault();
    onSaved(updateSettings(form));
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <section>
      <form className="card" onSubmit={submit}>
        <h3>⚙️ Instellingen</h3>

        <label>Dagelijkse kcal-doel
          <input type="number" value={form.dailyKcalTarget} onChange={set('dailyKcalTarget')} />
        </label>

        <h4>AI-fotoanalyse (Mistral)</h4>
        <label>API-key
          <input type="password" placeholder="Mistral API key" value={form.apiKey} onChange={set('apiKey')} />
        </label>
        <label>Model
          <input value={form.model} onChange={set('model')} />
        </label>

        <h4>Strava</h4>
        <label>Client ID
          <input value={form.stravaClientId} onChange={set('stravaClientId')} />
        </label>
        <label>Client Secret
          <input type="password" value={form.stravaClientSecret} onChange={set('stravaClientSecret')} />
        </label>

        <h4>Google Fit (gewicht via FITAGE-app)</h4>
        <label>Client ID
          <input value={form.googleClientId} onChange={set('googleClientId')} />
        </label>
        <label>Client Secret (optioneel)
          <input type="password" value={form.googleClientSecret} onChange={set('googleClientSecret')} />
        </label>

        <button className="primary" type="submit">Opslaan</button>
        <p className="muted small">
          Secrets worden lokaal op je toestel opgeslagen (localStorage), nooit naar een server gestuurd.
        </p>
      </form>
    </section>
  );
}
