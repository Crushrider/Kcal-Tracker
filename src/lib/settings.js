import { load, save } from './storage.js';

const SETTINGS_KEY = 'settings';
export const DEFAULT_SETTINGS = {
  apiKey: '',
  model: 'pixtral-12b-latest',
  dailyKcalTarget: 2200,
  stravaClientId: '',
  stravaClientSecret: '',
  googleClientId: '',
  googleClientSecret: ''
};

export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...load(SETTINGS_KEY, {}) };
}

export function updateSettings(patch) {
  const next = { ...getSettings(), ...patch };
  save(SETTINGS_KEY, next);
  return next;
}
