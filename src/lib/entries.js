import { load, save, isoDate } from './storage.js';

const FOOD_KEY = 'food-entries';
const WEIGHT_KEY = 'weight-entries';
const BURN_KEY = 'burn-entries';

export function getFoodEntries() {
  return load(FOOD_KEY, {});
}

export function addFoodEntry(entry) {
  const all = getFoodEntries();
  const day = entry.date;
  all[day] = [...(all[day] ?? []), entry];
  save(FOOD_KEY, all);
  return all;
}

export function deleteFoodEntry(date, id) {
  const all = getFoodEntries();
  all[date] = (all[date] ?? []).filter((e) => e.id !== id);
  save(FOOD_KEY, all);
  return all;
}

export function getWeightEntries() {
  return load(WEIGHT_KEY, {});
}

export function addWeightEntry(date, kg, source = 'manual') {
  const all = getWeightEntries();
  all[date] = { kg, source, at: new Date().toISOString() };
  save(WEIGHT_KEY, all);
  return all;
}

export function getBurnEntries() {
  return load(BURN_KEY, {});
}

export function setBurnEntriesForWeek(weekStartIso, days, kcalPerDay, source = 'strava') {
  const all = getBurnEntries();
  days.forEach((d) => {
    all[d] = { kcal: kcalPerDay[d] || 0, source };
  });
  save(BURN_KEY, all);
  return all;
}
