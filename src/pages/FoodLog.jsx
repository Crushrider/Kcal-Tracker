import React, { useRef, useState } from 'react';
import { analyzeFoodImage } from '../lib/vision.js';
import { addFoodEntry, deleteFoodEntry, getFoodEntries } from '../lib/entries.js';
import { isoDate } from '../lib/storage.js';

const COMMON = [
  { description: 'Boterham met kaas', kcal: 250 },
  { description: 'Banaan', kcal: 100 },
  { description: 'Kop koffie met melk', kcal: 30 },
  { description: 'Avondmaaltijd (warm)', kcal: 650 },
  { description: 'Bord soep', kcal: 200 }
];

export default function FoodLog({ settings, onChanged }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [manual, setManual] = useState({ description: '', kcal: '' });
  const [date, setDate] = useState(isoDate());
  const entries = getFoodEntries()[date] ?? [];

  async function onPhoto(file) {
    setError('');
    setResult(null);
    setPreview(URL.createObjectURL(file));
    setAnalyzing(true);
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const base64 = dataUrl.split(',')[1];
      const analysis = await analyzeFoodImage(base64, file.type);
      setResult(analysis);
    } catch (e) {
      setError(`${e.message} — je kunt de maaltijd ook handmatig invoeren.`);
    } finally {
      setAnalyzing(false);
    }
  }

  function saveAnalysis(a) {
    addFoodEntry({
      id: crypto.randomUUID(),
      date,
      description: a.description,
      portion: a.portion,
      kcal: Number(a.kcal) || 0,
      protein: a.protein,
      carbs: a.carbs,
      fat: a.fat,
      source: 'ai'
    });
    setResult(null);
    setPreview(null);
    onChanged();
  }

  function saveManual() {
    if (!manual.description || !manual.kcal) return;
    addFoodEntry({
      id: crypto.randomUUID(),
      date,
      description: manual.description,
      kcal: Number(manual.kcal),
      source: 'manual'
    });
    setManual({ description: '', kcal: '' });
    onChanged();
  }

  return (
    <section>
      <div className="card">
        <h3>📷 Foto van je maaltijd</h3>
        <label>
          Datum
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => e.target.files[0] && onPhoto(e.target.files[0])}
        />
        {preview && <img src={preview} alt="maaltijd" className="preview" />}
        {analyzing && <p>🔍 AI analyseert je maaltijd…</p>}
        {error && <p className="error">{error}</p>}
        {result && (
          <div className="analysis">
            <p><b>{result.description}</b> — {result.portion}</p>
            <p>{result.kcal} kcal · 🥩{result.protein}g 🍞{result.carbs}g 🧈{result.fat}g</p>
            <div className="row">
              <button className="primary" onClick={() => saveAnalysis(result)}>Opslaan</button>
              <button onClick={() => setResult(null)}>Opnieuw</button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h3>✍️ Handmatig invoeren</h3>
        <input
          placeholder="Wat heb je gegeten?"
          value={manual.description}
          onChange={(e) => setManual({ ...manual, description: e.target.value })}
        />
        <input
          type="number"
          placeholder="kcal"
          value={manual.kcal}
          onChange={(e) => setManual({ ...manual, kcal: e.target.value })}
        />
        <button className="primary" onClick={saveManual}>Toevoegen</button>
        <div className="chips">
          {COMMON.map((c) => (
            <button key={c.description} className="chip" onClick={() => setManual(c)}>
              {c.description} · {c.kcal}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Log van {date}</h3>
        {entries.length === 0 ? (
          <p className="muted">Nog geen items.</p>
        ) : (
          <ul className="list">
            {entries.map((e) => (
              <li key={e.id}>
                <span>
                  {e.description} {e.source === 'ai' ? '📷' : '✍️'}
                </span>
                <span className="row">
                  <b>{e.kcal} kcal</b>
                  <button className="danger" onClick={() => { deleteFoodEntry(date, e.id); onChanged(); }}>
                    ✕
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
        <p>
          <b>
            Totaal: {entries.reduce((s, e) => s + e.kcal, 0)} kcal
          </b>
        </p>
      </div>
    </section>
  );
}
