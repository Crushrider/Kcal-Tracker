import React, { useEffect, useState } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import FoodLog from './pages/FoodLog.jsx';
import Strava from './pages/Strava.jsx';
import Weight from './pages/Weight.jsx';
import WeeklyReport from './pages/WeeklyReport.jsx';
import Settings from './pages/Settings.jsx';
import { getSettings } from './lib/settings.js';

const TABS = [
  { id: 'dashboard', label: '📊 Vandaag' },
  { id: 'food', label: '🍽️ Eten' },
  { id: 'strava', label: '🚴 Strava' },
  { id: 'weight', label: '⚖️ Gewicht' },
  { id: 'report', label: '📈 Week' },
  { id: 'settings', label: '⚙️' }
];

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [settings, setSettings] = useState(getSettings());
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('strava_connected')) {
      setTab('strava');
      history.replaceState(null, '', location.pathname);
    }
    if (params.get('weight_connected')) {
      setTab('weight');
      history.replaceState(null, '', location.pathname);
    }
  }, []);

  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="app">
      <header className="header">
        <h1>Kcal Tracker</h1>
      </header>
      <main className="content">
        {tab === 'dashboard' && <Dashboard settings={settings} refreshKey={refreshKey} />}
        {tab === 'food' && <FoodLog settings={settings} onChanged={refresh} />}
        {tab === 'strava' && <Strava settings={settings} onChanged={refresh} />}
        {tab === 'weight' && <Weight settings={settings} onChanged={refresh} />}
        {tab === 'report' && <WeeklyReport settings={settings} refreshKey={refreshKey} />}
        {tab === 'settings' && (
          <Settings
            onSaved={(s) => {
              setSettings(s);
              refresh();
            }}
          />
        )}
      </main>
      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'tab active' : 'tab'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
