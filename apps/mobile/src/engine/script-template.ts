import { FoodCandidate, ClientType, NutrientKey } from './types';
import { NUTRIENT_LABELS } from './rationale';

/**
 * Step 7: Assemble the fallback voice script template.
 * This is used when the device is offline and the LLM-enriched script is not yet cached.
 * The AI enrichment layer replaces this with a warmer, natural-language version on next sync.
 */
export function buildScriptTemplate(
  clientType: ClientType,
  basket: FoodCandidate[],
  activeNutrients: NutrientKey[],
  language = 'en',
): string {
  const foodNames = basket.map((f) => f.localName || f.name).join(', ');
  const nutrientLabels = activeNutrients.map((n) => NUTRIENT_LABELS[n]).join(' and ');

  const supplement =
    clientType === 'pregnant'
      ? ' Remember to take your iron-folate supplement every day.'
      : '';

  // Fallback English template — the voice pack maps this to pre-recorded phrases
  if (language === 'en') {
    return (
      `For your health, eat these foods this week: ${foodNames}. ` +
      `These foods are available now and help with ${nutrientLabels}.` +
      supplement
    );
  }

  // For other languages, return a key that the voice pack template_map resolves
  return JSON.stringify({
    template: 'nutrition_plan',
    params: {
      foods: basket.map((f) => ({ id: f.id, localName: f.localName })),
      nutrients: activeNutrients,
      clientType,
      supplement: clientType === 'pregnant',
    },
  });
}
