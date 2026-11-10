import { getSettings } from './settings.js';

export async function analyzeFoodImage(base64Image, mimeType) {
  const { apiKey, model } = getSettings();
  if (!apiKey) throw new Error('Geen API-key ingesteld onder Instellingen.');

  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content:
            'Je bent een voedingsdeskundige. Schat op basis van de foto van de maaltijd: ' +
            'wat het eten is, de portiegrootte, calorieën (kcal) en macrovoedingsstoffen. ' +
            'Antwoord ALLEEN met geldige JSON: ' +
            '{"description": string, "portion": string, "kcal": number, "protein": number, "carbs": number, "fat": number}'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyseer deze maaltijd en geef de kcal-schatting als JSON.' },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
          ]
        }
      ],
      max_tokens: 400,
      temperature: 0.2
    })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Vision API fout (${res.status}): ${body}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Geen geldige JSON van het model ontvangen.');
  return JSON.parse(jsonMatch[0]);
}
