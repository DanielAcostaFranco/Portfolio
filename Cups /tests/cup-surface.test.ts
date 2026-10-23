import { describe, it, expect } from 'vitest';
import { petFinish, surfaceOpacity, opacityAfterColorChange } from '../app/cup-surface';
describe('cup background transparency', () => {
    it('starts a newly chosen PET color as a translucent tint and retains explicit alpha afterwards', () => {
        expect(opacityAfterColorChange('clear', 0)).toBe(.25);
        expect(opacityAfterColorChange('clear', .35)).toBe(.35);
        expect(opacityAfterColorChange('clear', 1)).toBe(1);
        expect(opacityAfterColorChange('paper', 0)).toBe(1);
    });
    it('starts PET with no opaque coating, regardless of selected background color', () => {
        expect(surfaceOpacity('clear')).toBe(0);
        expect(surfaceOpacity('clear', 0)).toBe(0);
        expect(petFinish(0).transmission).toBe(1);
        expect(petFinish(0).opacity).toBeLessThan(.05);
        expect(petFinish(0).rimOpacity).toBeGreaterThan(petFinish(0).opacity);
    });
    it('supports translucent tint and a genuinely solid coating', () => {
        expect(petFinish(.5).transmission).toBe(.5);
        expect(petFinish(1).opacity).toBe(1);
        expect(petFinish(1).transmission).toBe(0);
    });
    it('keeps paper and foam opaque when switching from transparent PET', () => {
        expect(surfaceOpacity('paper', 0)).toBe(1);
        expect(surfaceOpacity('foam', .3)).toBe(1);
    });
    it('bounds alpha without losing an explicit zero', () => {
        expect(surfaceOpacity('clear', -1)).toBe(0);
        expect(surfaceOpacity('clear', 2)).toBe(1);
        expect(surfaceOpacity('clear', NaN)).toBe(0);
    });
});
