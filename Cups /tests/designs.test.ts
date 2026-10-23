import { describe, it, expect } from "vitest";
import { demoVariations, catalogDesign, initialBrandDirections, clampPlacement, validateVariants } from "../app/designs";
const base = catalogDesign(0, "#b73825", "#f8e9cf");
const placement = { scale: 100, horizontal: 0, vertical: 0 };
describe("brief-driven studio preview", () => {
    it("offers three brand-led compositions with distinct cup substrates before editing", () => {const variants=initialBrandDirections('Sunday Coffee','#b73825','#f8e9cf');expect(variants).toHaveLength(3);expect(new Set(variants.map(v=>v.design.background)).size).toBe(3);expect(variants.every(v=>v.design.color==='#b73825')).toBe(true);expect(new Set(variants.map(v=>v.design.pattern)).size).toBe(3);});
    it("keeps all seasonal alternatives in the requested collection", () => {const variants=demoVariations("navidad con pinos",base,placement);expect(variants.every(v=>v.design.pattern==="holiday")).toBe(true);expect(new Set(variants.map(v=>v.design.density)).size).toBe(3);});
    it("retains an independently chosen cup color during refinement", () => {expect(demoVariations("botanical",{...base,background:"#e8d8bf"},placement).every(v=>v.design.background==="#e8d8bf")).toBe(true);});
    it("interprets Spanish requests for a smaller, raised, green botanical design", () => { const variants = demoVariations("Quiero hojas verdes y el logo más pequeño y arriba", base, placement); expect(variants).toHaveLength(3); expect(variants[0].design.pattern).toBe("botanical"); expect(variants[0].design.color).toBe("#66745a"); expect(variants.every(v => v.placement.scale < 100 && v.placement.vertical < 0)).toBe(true); });
    it("interprets a larger, lower logo and explicit requested hex colors", () => { const variants = demoVariations("Retro checker, bigger logo lower, #315e83 and #f2d9bd", base, placement); expect(variants[0].design.pattern).toBe("checker"); expect(variants[0].design.color).toBe("#315e83"); expect(variants[0].design.accent).toBe("#f2d9bd"); expect(variants[0].placement.scale).toBeGreaterThan(100); expect(variants[0].placement.vertical).toBeGreaterThan(0); });
    it("preserves the source palette and placement without a request to change them", () => { const variants = demoVariations("Make it elegant", base, { ...placement, vertical: 10 }); expect(variants[1].design.color).toBe(base.color); expect(variants[1].placement.vertical).toBe(10); });
    it("bounds direct logo controls at safe values", () => expect(clampPlacement({ scale: 300, horizontal: -100, vertical: 500 })).toEqual({ scale: 150, horizontal: -30, vertical: 40 }));
    it("keeps all three preview directions distinct even when the starting style is botanical", () => { const variants = demoVariations("Try something different", { ...base, pattern: "botanical" }, placement); expect(new Set(variants.map(v => v.design.pattern)).size).toBe(3); });
});
function payload() { return { variants: demoVariations("botanical green", base, placement).map(v => ({ ...v.design, ...v.placement, reason: v.reason })) }; }
describe("provider output validation", () => {
    it("accepts three bounded design specifications", () => expect(validateVariants(payload())).toHaveLength(3));
    it("rejects arbitrary pattern code or external content", () => { const p = payload(); p.variants[0].pattern = "<svg onload=alert(1)>" as never; expect(() => validateVariants(p)).toThrow("Invalid design values"); });
    it("rejects non-color CSS input", () => { const p = payload(); p.variants[0].color = "url(https://example.com)"; expect(() => validateVariants(p)).toThrow(); });
    it("rejects non-finite or oversized logo placement", () => { const p = payload(); p.variants[0].scale = Infinity; expect(() => validateVariants(p)).toThrow(); });
    it("rejects incomplete result sets", () => expect(() => validateVariants({ variants: [] })).toThrow("Expected three design variations"));
    it("rejects three copies of the same creative option", () => { const p = payload(); p.variants = [p.variants[0], p.variants[0], p.variants[0]]; expect(() => validateVariants(p)).toThrow("Expected distinct design variations"); });
});
