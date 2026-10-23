export type BusinessCategory = 'restaurant' | 'coffee' | 'ice-cream' | 'bakery' | 'juice' | 'other';
export type CupRecommendation = { material: 'paper' | 'foam' | 'clear'; size: 8 | 12 | 16 | 20 | 24; reason: string };
export type Prospect = { id: string; name: string; address: string; website: string; phone: string; category: BusinessCategory; types: string[]; recommendation: CupRecommendation; wikidata?: string; brand?: string };

const categoryLabels: Record<BusinessCategory, string> = { restaurant: 'Restaurant', coffee: 'Coffee shop', 'ice-cream': 'Ice cream', bakery: 'Bakery', juice: 'Juice bar', other: 'Food & drink' };
export function categoryLabel(category: BusinessCategory) { return categoryLabels[category]; }
export function classifyBusiness(name: string, types: readonly string[] = [], description = '') {
    const text = (name + ' ' + types.join(' ') + ' ' + description).toLowerCase();
    if (/ice_?cream|gelato|helad|dessert|frozen_yogurt/.test(text)) return 'ice-cream' as const;
    if (/coffee|cafe|café|espresso|roaster|tea/.test(text)) return 'coffee' as const;
    if (/bakery|bake|panader|pastry|bread/.test(text)) return 'bakery' as const;
    if (/juice|smoothie|acai|fresh/.test(text)) return 'juice' as const;
    if (/restaurant|food|bar|grill|diner|pizza|taco|burger/.test(text)) return 'restaurant' as const;
    return 'other' as const;
}
export function cupRecommendation(category: BusinessCategory): CupRecommendation {
    if (category === 'ice-cream') return { material: 'clear', size: 16, reason: 'Clear PET lets layered cold drinks and toppings show.' };
    if (category === 'coffee' || category === 'bakery') return { material: 'paper', size: 12, reason: 'Paper is the natural fit for hot coffee and bakery service.' };
    if (category === 'juice') return { material: 'clear', size: 20, reason: 'Clear PET highlights bright juices and smoothies.' };
    if (category === 'restaurant') return { material: 'foam', size: 20, reason: 'Foam works well for larger cold fountain drinks.' };
    return { material: 'paper', size: 12, reason: 'A versatile starting point for a food and drink brand.' };
}
