import { it, expect, describe } from "vitest";
import { removeWhiteEdges } from "../app/logo-background";
describe("optional white background removal", () => {
    it("removes only border-connected white and preserves enclosed white logo details", () => {
        const pixels = new Uint8ClampedArray(5 * 5 * 4).fill(255);
        for (let y = 1; y < 4; y++)
            for (let x = 1; x < 4; x++) {
                if (x === 2 && y === 2)
                    continue;
                const i = (y * 5 + x) * 4;
                pixels[i] = pixels[i + 1] = pixels[i + 2] = 0;
            }
        const result = removeWhiteEdges(pixels, 5, 5);
        expect(result[3]).toBe(0);
        expect(result[(2 * 5 + 2) * 4 + 3]).toBe(255);
        expect(result[(1 * 5 + 1) * 4 + 3]).toBe(255);
    });
    it("does not modify the approved source pixel buffer", () => { const pixels = new Uint8ClampedArray([255, 255, 255, 255]); removeWhiteEdges(pixels, 1, 1); expect(pixels[3]).toBe(255); });
    it("rejects malformed pixel data", () => expect(() => removeWhiteEdges(new Uint8ClampedArray(4), 2, 2)).toThrow("Invalid pixel dimensions"));
});
