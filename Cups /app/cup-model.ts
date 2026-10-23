export type Material = "paper" | "foam" | "clear";
export type CupSize = 8 | 12 | 16 | 20 | 24;
export type CupProduct = {
    material: Material;
    size: CupSize;
};
export type PrintPlacement = {
    scale: number;
    horizontal: number;
    vertical: number;
};
export type CupProfile = {
    label: string;
    asset: string;
    sizes: CupSize[];
    top: number;
    bottom: number;
    radiusTop: number;
    radiusBottom: number;
    depth: number;
    sampleCents: number;
};
// Coordinates are calibrated to the photographic template, in a 1024-square space.
export const CUP_PROFILES: Record<Material, CupProfile> = {
    paper: { label: "Paper", asset: "/cups/paper.png", sizes: [8, 12, 16], top: 249, bottom: 900, radiusTop: 225, radiusBottom: 161, depth: 18, sampleCents: 31 },
    foam: { label: "Foam", asset: "/cups/foam.png", sizes: [8, 12, 16, 20], top: 316, bottom: 822, radiusTop: 258, radiusBottom: 178, depth: 22, sampleCents: 24 },
    clear: { label: "Clear PET", asset: "/cups/clear.png", sizes: [12, 16, 20, 24], top: 249, bottom: 698, radiusTop: 228, radiusBottom: 184, depth: 24, sampleCents: 36 },
};
export function selectMaterial(material: Material, currentSize: CupSize): CupProduct {
    const sizes = CUP_PROFILES[material].sizes;
    return { material, size: sizes.includes(currentSize) ? currentSize : sizes.reduce((a, b) => Math.abs(b - currentSize) < Math.abs(a - currentSize) ? b : a) };
}
export function productLabel(product: CupProduct) { return `${product.size} oz ${CUP_PROFILES[product.material].label.toLowerCase()} cup`; }
export function cupPrice(product: CupProduct) { return CUP_PROFILES[product.material].sampleCents + Math.round((product.size - 12) * 1.5); }
export function sizeTransform(product: CupProduct) {
    const reference = product.material === "clear" ? 20 : product.material === "foam" ? 12 : 16;
    const ratio = product.size / reference;
    const frame = product.material === "foam" ? .70 : product.material === "clear" ? .87 : 1;
    // Illustrative volume proportions: diameter² × height tracks the capacity ratio.
    // A fixed camera per material keeps all capacities inside the photograph frame.
    return { x: frame * Math.pow(ratio, .16), y: frame * Math.pow(ratio, .68) };
}
export function projectCup(u: number, v: number, profile: CupProfile) {
    const angle = (u - .5) * 2.7;
    const radius = profile.radiusTop + (profile.radiusBottom - profile.radiusTop) * v;
    return { x: 512 + Math.sin(angle) * radius, y: profile.top + (profile.bottom - profile.top) * v + Math.cos(angle) * profile.depth };
}
