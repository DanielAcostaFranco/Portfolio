import type { CupProduct } from './cup-model';
export const SEASONS = ['none', 'holiday', 'summer', 'valentine', 'halloween'] as const;
export type Season = typeof SEASONS[number];
export type SurfaceOptions = {
    background: string;
    message: string;
    messageColor: string;
    season: Season;
};
export const DEFAULT_SURFACE: SurfaceOptions = { background: '#ffffff', message: '', messageColor: '#262626', season: 'none' };
export function cupDimensions(product: CupProduct) {
    const factor = Math.cbrt(product.size / 12);
    // Foam reference silhouette: 3.5 in mouth × 2.1 in base × 4.4 in height.
    // Capacities remain illustrative, scaled together rather than manufacturer-specific SKUs.
    const shape = product.material === 'foam' ? { top: .82, bottom: .492, height: 2.062, wall: .056 } : product.material === 'clear' ? { top: .82, bottom: .58, height: 2.12, wall: .012 } : { top: .8, bottom: .55, height: 2.05, wall: .022 };
    return Object.fromEntries(Object.entries(shape).map(([key, value]) => [key, value * factor])) as typeof shape;
}
export function seasonFromBrief(brief: string): Season {
    if (/christmas|holiday|navidad|invierno|winter/i.test(brief))
        return 'holiday';
    if (/halloween|spooky|calabaza/i.test(brief))
        return 'halloween';
    if (/valentine|valentin|amor|romantic/i.test(brief))
        return 'valentine';
    if (/summer|verano|citrus|citrico|beach|playa/i.test(brief))
        return 'summer';
    return 'none';
}
// Reject active or externally linked SVGs before they ever become an image source.
export function validateLogoSvg(source: string) {
    if (!/<svg[\s>]/i.test(source) || !/<\/svg\s*>/i.test(source) || /<!DOCTYPE|<!ENTITY|<\?|<!--|<\s*(script|foreignObject|iframe|image|animate\w*|set|style|a)\b|\bon\w+\s*=|(?:href|src)\s*=\s*['"]\s*(?!#)|url\s*\(\s*['"]?\s*(?!#)|javascript:|data:|https?:/i.test(source.replace(/http:\/\/www\.w3\.org\/2000\/svg/g, '')))
        throw Error('Use a self-contained SVG without scripts or external images.');
    return source;
}
export function paletteFromPixels(pixels: Uint8ClampedArray): [
    string,
    string
] {
    const bins = new Map<string, number>();
    for (let i = 0; i < pixels.length; i += 4) {
        const [r, g, b, a] = pixels.slice(i, i + 4);
        if (a < 180 || Math.min(r, g, b) > 235 || Math.max(r, g, b) < 25)
            continue;
        const key = [r, g, b].map(v => Math.min(255, Math.round(v / 24) * 24).toString(16).padStart(2, '0')).join('');
        bins.set(key, (bins.get(key) ?? 0) + 1);
    }
    const colors = [...bins].sort((a, b) => b[1] - a[1]).map(([hex]) => '#' + hex);
    const first = colors[0] ?? '#252525';
    const rgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
    const second = colors.find(c => rgb(c).reduce((n, v, i) => n + Math.abs(v - rgb(first)[i]), 0) > 150) ?? '#f1e6d5';
    return [first, second];
}
