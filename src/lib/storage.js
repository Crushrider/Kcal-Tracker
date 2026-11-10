const PREFIX = 'kcal-tracker:';

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export const isoDate = (d = new Date()) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export const addDays = (iso, days) => {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return isoDate(d);
};

export const weekStart = (iso) => {
  const d = new Date(iso + 'T00:00:00');
  const diff = (d.getDay() + 6) % 7;
  return addDays(iso, -diff);
};

export function daysBetween(startIso, endIso) {
  const out = [];
  let cur = startIso;
  while (cur <= endIso) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}
