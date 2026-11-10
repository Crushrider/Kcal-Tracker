import React, { useMemo, useState } from 'react';
import { buildWeeklyReport, saveWeeklyReport } from '../lib/report.js';
import { getFoodEntries, getBurnEntries, getWeightEntries } from '../lib/entries.js';
import { isoDate, weekStart, addDays } from '../lib/storage.js';

export default function WeeklyReport({ settings, refreshKey }) {
  const [offset, setOffset] = useState(0);
  const [saved, setSaved] = useState('');

  const report = useMemo(() => {
    const ref = addDays(isoDate(), offset * 7);
    return buildWeeklyReport({
      date: ref,
      foodEntries: getFoodEntries(),
      burnEntries: getBurnEntries(),
      weightEntries: getWeightEntries(),
      dailyKcalTarget: settings.dailyKcalTarget
    });
  }, [offset, settings.dailyKcalTarget, refreshKey]);

  function save() {
    saveWeeklyReport(report);
    setSaved(`Rapport van week ${report.weekStart} opgeslagen ✅`);
  }

  return (
    <section key={refreshKey}>
      <div className="card big">
        <h2>Weekrapport</h2>
        <p className="muted">{report.weekStart} → {report.weekEnd}</p>
        <div className="row">
          <button onClick={() => setOffset(offset + 1)}>◀ Vorige</button>
          <button onClick={() => setOffset(0)} disabled={offset === 0}>Deze week</button>
          <button onClick={() => setOffset(Math.max(0, offset - 1))} disabled={offset === 0}>Volgende ▶</button>
        </div>

        <ul className="stats">
          <li>🍽️ Gegeten: <b>{report.kcalIn} kcal</b></li>
          <li>🚴 Verbrand (Strava): <b>{report.kcalOut} kcal</b></li>
          <li>⚖️ Startgewicht: <b>{report.startWeight != null ? report.startWeight.toFixed(1) + ' kg' : '—'}</b></li>
          <li>⚖️ Eindgewicht: <b>{report.endWeight != null ? report.endWeight.toFixed(1) + ' kg' : '—'}</b></li>
          <li>📉 Gewichtswijziging: <b>{report.weightDelta != null ? report.weightDelta.toFixed(2) + ' kg' : '—'}</b></li>
          <li>🔮 Voorspeld op basis van caloriebalans: <b>{report.predictedKg.toFixed(2)} kg</b></li>
        </ul>

        <p className="verdict">{report.verdict}</p>
        <button className="primary" onClick={save}>Rapport opslaan</button>
        {saved && <p className="muted">{saved}</p>}
      </div>

      <div className="card">
        <h3>Per dag</h3>
        <ul className="list">
          {report.perDay.map((d) => (
            <li key={d.date}>
              <span>{d.date}</span>
              <span>🍽️ {d.eaten} · 🚴 {d.burned} · {d.net >= 0 ? '✅' : '⚠️'} {d.net}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
