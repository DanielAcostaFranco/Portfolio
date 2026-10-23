import { describe, expect, it } from 'vitest';
import { categoryLabel, classifyBusiness, cupRecommendation } from '../app/prospecting';
import { buildOverpassQuery, osmElementsToProspects } from '../app/osm-prospects';
describe('prospecting recommendations', () => {
    it.each([['Gelato Luna', ['ice_cream'], 'ice-cream'], ['Northside Café', ['cafe'], 'coffee'], ['Pan Dulce', ['bakery'], 'bakery'], ['Green Press', ['juice_bar'], 'juice'], ['Burger House', ['restaurant'], 'restaurant']] as const)('classifies %s', (name, types, expected) => expect(classifyBusiness(name, types)).toBe(expected));
    it('maps each category to a practical cup', () => { expect(cupRecommendation('ice-cream').material).toBe('clear'); expect(cupRecommendation('coffee').material).toBe('paper'); expect(cupRecommendation('restaurant').material).toBe('foam'); });
    it('keeps user-facing category labels stable', () => expect(categoryLabel('coffee')).toBe('Coffee shop'));
    it('turns OSM nodes and ways into deduplicated prospect-ready records', () => {
        const results = osmElementsToProspects([{ type: 'node', id: 1, lat: 30, lon: -97, tags: { name: 'Luna Café', amenity: 'cafe', website: 'https://luna.example', 'addr:street': 'Main St' } }, { type: 'way', id: 2, center: { lat: 30, lon: -97 }, tags: { name: 'Cold Gelato', amenity: 'ice_cream', 'contact:phone': '555' } }], 'Austin');
        expect(results.map(result => result.category)).toEqual(['ice-cream', 'coffee']);
        expect(results[1].website).toBe('https://luna.example');
        expect(results[0].recommendation.material).toBe('clear');
    });
    it('builds a bounded Overpass query for food and drink tags', () => {
        const query = buildOverpassQuery({ south: 1, west: 2, north: 3, east: 4 });
        expect(query).toContain('1,2,3,4');
        expect(query).toContain('ice_cream');
        expect(query).toContain('["shop"~"bakery|confectionery|coffee|ice_cream"]');
        expect(query).toContain('food_court');
    });
});
