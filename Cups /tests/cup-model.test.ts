import { describe, it, expect } from "vitest";
import { CUP_PROFILES, selectMaterial, productLabel, cupPrice, projectCup, sizeTransform } from "../app/cup-model";
describe("cup selection", () => {
    it("keeps a supported capacity when switching material", () => expect(selectMaterial("clear", 16)).toEqual({ material: "clear", size: 16 }));
    it("moves an unsupported capacity to the closest available size", () => expect(selectMaterial("paper", 24)).toEqual({ material: "paper", size: 16 }));
    it("names the actual selected cup for proposals", () => expect(productLabel({ material: "foam", size: 20 })).toBe("20 oz foam cup"));
    it("changes sample price with selected material and capacity", () => { expect(cupPrice({ material: "foam", size: 12 })).toBe(24); expect(cupPrice({ material: "clear", size: 24 })).toBe(54); });
    it("gives smaller capacities shorter photographic proportions", () => expect(sizeTransform({ material: "paper", size: 8 }).y).toBeLessThan(sizeTransform({ material: "paper", size: 16 }).y));
});
describe("curved printing projection", () => {
    it("keeps a centered mark centered on the cup", () => expect(projectCup(.5, .5, CUP_PROFILES.paper).x).toBe(512));
    it("compresses artwork horizontally as it turns toward the sides", () => { const p = CUP_PROFILES.paper; const center = projectCup(.55, .5, p).x - projectCup(.5, .5, p).x; const edge = projectCup(.95, .5, p).x - projectCup(.9, .5, p).x; expect(edge).toBeLessThan(center); });
    it("follows the tapered body rather than a flat rectangle", () => { const p = CUP_PROFILES.foam; expect(projectCup(.9, .9, p).x).toBeLessThan(projectCup(.9, .1, p).x); });
    it("curves the horizontal artwork baseline over the surface", () => { const p = CUP_PROFILES.clear; expect(projectCup(.5, .5, p).y).toBeGreaterThan(projectCup(.1, .5, p).y); });
});
