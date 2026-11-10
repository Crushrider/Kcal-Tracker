import { load, save, weekStart, daysBetween, isoDate, addDays } from './storage.js';

const REPORT_KEY = 'weekly-reports';

export function buildWeeklyReport({ date, foodEntries, burnEntries, weightEntries, dailyKcalTarget }) {
  const start = weekStart(isoDate(date));
  const endIso = addDays(start, 6);
  const days = daysBetween(start, endIso);

  let kcalIn = 0;
  let kcalOut = 0;
  const perDay = days.map((d) => {
    const eaten = (foodEntries[d] ?? []).reduce((s, e) => s + (e.kcal || 0), 0);
    const burned = burnEntries[d]?.kcal || 0;
    kcalIn += eaten;
    kcalOut += burned;
    return { date: d, eaten, burned, net: dailyKcalTarget + burned - eaten };
  });

  const weights = days
    .filter((d) => weightEntries[d])
    .map((d) => ({ date: d, kg: weightEntries[d].kg }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const startWeight = weights[0]?.kg ?? null;
  const endWeight = weights[weights.length - 1]?.kg ?? null;
  const weightDelta = startWeight != null && endWeight != null ? endWeight - startWeight : null;

  const netBalance = dailyKcalTarget * days.length + kcalOut - kcalIn;
  const predictedKg = netBalance / 7700;

  return {
    weekStart: start,
    weekEnd: endIso,
    perDay,
    kcalIn,
    kcalOut,
    netBalance,
    predictedKg,
    startWeight,
    endWeight,
    weightDelta,
    verdict:
      weightDelta == null
        ? 'Geen gewichtsmetingen deze week — koppel je slimme weegschaal of voer handmatig in.'
        : weightDelta < -0.1
          ? `Je bent ongeveer ${Math.abs(weightDelta).toFixed(2)} kg verloren deze week.`
          : weightDelta > 0.1
            ? `Je bent ongeveer ${weightDelta.toFixed(2)} kg aangekomen deze week.`
            : 'Je gewicht is vrijwel gelijk gebleven deze week.'
  };
}

export function saveWeeklyReport(report) {
  const all = load(REPORT_KEY, {});
  all[report.weekStart] = report;
  save(REPORT_KEY, all);
  return all;
}

export function getWeeklyReports() {
  return load(REPORT_KEY, {});
}
