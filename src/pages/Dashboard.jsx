import React from 'react';
import { isoDate } from '../lib/storage.js';
import { getFoodEntries, getBurnEntries, getWeightEntries } from '../lib/entries.js';

export default function Dashboard({ settings, refreshKey }) {
  const today = isoDate();
  const food = getFoodEntries()[today] ?? [];
  const eaten = food.reduce((s, e) => s + (e.kcal || 0), 0);
  const burned = getBurnEntries()[today]?.kcal || 0;
  const target = settings.dailyKcalTarget;
  const budget = target + burned - eaten;
  const weight = getWeightEntries()[today];

  return (
    <section key={refreshKey}>
      <div className="card big">
        <h2>Vandaag</h2>
        <p className="kcal">{eaten} / {target} kcal</p>
        <div className="bar">
          <div
            className="fill"
            style={{ width: `${Math.min(100, (eaten / target) * 100)}%` }}
          />
        </div>
        <ul className="stats">
          <li>🔥 Verbrand via sport: <b>{burned} kcal</b></li>
          <li>✅ Resterend budget: <b>{budget} kcal</b></li>
          {weight && <li>⚖️ Gewicht vandaag: <b>{weight.kg.toFixed(1)} kg</b></li>}
        </ul>
      </div>

      <div className="card">
        <h3>Maaltijden van vandaag</h3>
        {food.length === 0 ? (
          <p className="muted">Nog niets gelogd. Ga naar "Eten" en maak een foto van je maaltijd.</p>
        ) : (
          <ul className="list">
            {food.map((e) => (
              <li key={e.id}>
                <span>{e.description}</span>
                <b>{e.kcal} kcal</b>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
