import { describe, it, expect } from 'vitest';
import { logoStamps, fontFamily, validateFontFile, retainPrintOptions } from '../app/print-options';
import { cupDimensions } from '../app/studio-options';
describe('wrap printing', () => {
    it('gives foam a visibly broader profile and a substantially thicker wall than paper', () => {
        const foam = cupDimensions({ material: 'foam', size: 12 }), paper = cupDimensions({ material: 'paper', size: 12 });
        expect(foam.wall).toBeGreaterThan(paper.wall * 2.5);
        expect(foam.top / foam.height).toBeGreaterThan(paper.top / paper.height);
    });
    it('places the front and reverse logos exactly half a circumference apart', () => {
        const stamps = logoStamps('both');
        expect(stamps).toHaveLength(2);
        expect(Math.abs(stamps[0].u - stamps[1].u)).toBe(.5);
        expect(stamps[1].back).toBe(true);
    });
    it('creates a staggered all-over print with bounded, smaller marks', () => {
        const stamps = logoStamps('repeat');
        expect(stamps).toHaveLength(24);
        expect(stamps.every(s => s.u >= 0 && s.u < 1 && s.v > 0 && s.v < 1 && s.scale < .5)).toBe(true);
        expect(stamps[0].u).not.toBe(stamps[6].u);
    });
    it('defaults to one front logo', () => expect(logoStamps()).toEqual([{ u: .5, v: .5, scale: 1, back: false }]));
    it('preserves print choices when a new style or AI option is selected', () => {
        const current = { lid: true, logoLayout: 'both' as const, logoColor: '#112233', messageFont: 'Georgia', backLogo: 'data:image/png;base64,x' };
        expect(retainPrintOptions({ pattern: 'tidal' }, current)).toMatchObject({ ...current, pattern: 'tidal' });
    });
});
describe('local message fonts', () => {
    it('accepts built-in and internally named uploaded families, not arbitrary CSS', () => {
        expect(fontFamily('Georgia')).toBe('Georgia');
        expect(fontFamily('StudioFont-abc-123')).toBe('StudioFont-abc-123');
        expect(fontFamily('Arial;url(x)')).toBe('Arial');
    });
    it.each([['woff', 'wOFF'], ['woff2', 'wOF2'], ['otf', 'OTTO']])('recognizes %s signatures', (extension, header) => expect(() => validateFontFile('Brand.' + extension, 100, new TextEncoder().encode(header))).not.toThrow());
    it('recognizes TrueType headers', () => expect(() => validateFontFile('Brand.ttf', 100, new Uint8Array([0, 1, 0, 0]))).not.toThrow());
    it('rejects fake and oversized font uploads', () => {
        expect(() => validateFontFile('Logo.ttf', 5, new TextEncoder().encode('<svg>'))).toThrow();
        expect(() => validateFontFile('Big.woff', 6 * 1024 * 1024, new TextEncoder().encode('wOFF'))).toThrow();
    });
});
