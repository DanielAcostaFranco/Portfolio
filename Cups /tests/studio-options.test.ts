import { describe, it, expect } from 'vitest';
import { cupDimensions, paletteFromPixels, seasonFromBrief, validateLogoSvg } from '../app/studio-options';
describe('studio customization', () => {
    it('scales all cup dimensions proportionally to capacity', () => {
        const small = cupDimensions({ material: 'paper', size: 8 }), big = cupDimensions({ material: 'paper', size: 16 });
        expect((big.top / small.top) ** 3).toBeCloseTo(2);
        expect(small.top).toBeGreaterThan(small.bottom);
        expect(small.wall).toBeGreaterThan(0);
    });
    it('retains the physical differences between foam and PET', () => {
        expect(cupDimensions({ material: 'foam', size: 12 }).wall).toBeGreaterThan(cupDimensions({ material: 'clear', size: 12 }).wall);
    });
    it.each([8, 12, 16, 20] as const)('gives the %i oz foam cup a tall drink-cup silhouette, not a squat bowl', size => {
        const cup = cupDimensions({ material: 'foam', size });
        // Reference 12 oz foam drink cup: 4.4 in tall, 3.5 in mouth, 2.1 in base.
        expect(cup.height / (cup.top * 2)).toBeCloseTo(4.4 / 3.5, 2);
        expect(cup.bottom / cup.top).toBeCloseTo(2.1 / 3.5, 2);
        expect(cup.wall / cup.top).toBeGreaterThan(.04);
        expect(cup.wall / cup.top).toBeLessThan(.07);
    });
    it('recognizes seasonal briefs in both languages', () => {
        expect(seasonFromBrief('Una edición para navidad')).toBe('holiday');
        expect(seasonFromBrief('citrus summer')).toBe('summer');
        expect(seasonFromBrief('Halloween')).toBe('halloween');
        expect(seasonFromBrief('San Valentin')).toBe('valentine');
        expect(seasonFromBrief('minimal')).toBe('none');
    });
    it('extracts dominant brand colors, ignoring transparent and white pixels', () => {
        expect(paletteFromPixels(new Uint8ClampedArray([255, 255, 255, 255, 0, 0, 255, 0, 192, 24, 24, 255, 192, 24, 24, 255, 24, 144, 72, 255]))).toEqual(['#c01818', '#189048']);
    });
    it('accepts a self-contained vector with a local gradient', () => {
        const svg = '<svg xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="ink"/></defs><path fill="url(#ink)" d="M0 0"/></svg>';
        expect(validateLogoSvg(svg)).toBe(svg);
    });
    it.each(['<script>alert(1)</script>', '<image href="https://example.com/x"/>', '<path onload="x()"/>', '<foreignObject/>', '<use href="data:x"/>', '<!ENTITY x "a">'])('rejects active or external SVG content: %s', fragment => {
        expect(() => validateLogoSvg('<svg>' + fragment + '</svg>')).toThrow();
    });
});
