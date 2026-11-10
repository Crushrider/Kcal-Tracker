# Kcal Tracker (PWA)

Mobiele kcal-tracker als Progressive Web App: installeerbaar op je gsm via de browser, geen app-store nodig.

## Functies

- **📷 Eten loggen via foto** — maak een foto van je maaltijd; de Mistral vision API (bijv. Pixtral) schat het gerecht, de portie, kcal en macro's. Je kunt de schatting corrigeren of een maaltijd handmatig/snelkeuze invoeren.
- **🚴 Strava-integratie** — OAuth-koppeling; haalt sportactiviteiten op en slaat verbrande calorieën per dag op.
- **⚖️ Automatisch gewicht** — koppeling met Withings (slimme weegschaal) via OAuth; handmatig invoeren is ook mogelijk.
- **📈 Weekrapport** — per dag kcal in/uit, start- en eindgewicht, gewichtsverandering of -toename, plus een voorspelling op basis van de caloriebalans (7.700 kcal ≈ 1 kg).

## Lokaal draaien

```bash
npm install
npm run dev       # ontwikkeling
npm run build     # productie-build (PWA, service worker)
npm run preview   # productie-build lokaal bekijken
```

## Configuratie (tabblad ⚙️ in de app)

1. **Mistral API key** — voor de fotoanalyse. Aanmaken op console.mistral.ai.
2. **Strava** — maak een API-applicatie aan op strava.com/settings/api. Zet als *Authorization Callback Domain* het domein waarop de app draait. Vul Client ID + Secret in de app in en koppel.
3. **Withings** — maak een app aan op developer.withings.com met scope `user.metrics`. Zet dezelfde callback-URL. Vul Client ID + Secret in en koppel.
4. **Dagelijkse kcal-doel** — je basisdoel; sport-kcal worden daar bij opgeteld.

Alle sleutels en data blijven lokaal op het toestel (localStorage).

## Technische opzet

- React + Vite + `vite-plugin-pwa` (manifest, service worker, installeerbaar)
- `src/lib/vision.js` — foto → JSON met kcal/macro's via Mistral chat completions
- `src/lib/strava.js` — OAuth (incl. refresh token) + activiteiten ophalen
- `src/lib/withings.js` — OAuth + gewichtsmetingen ophalen
- `src/lib/report.js` — weekberekening en -opslag

## Opmerkingen

- De OAuth-redirects vereisen dat de app via `https://` draait (bijv. GitHub Pages, Netlify, Vercel). Lokaal testen kan met `npm run dev`.
- De vision-API is een schatting; gebruik de handmatige correctie voor nauwkeurigheid.
