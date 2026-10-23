import { CUP_PROFILES, type CupProduct, type PrintPlacement } from "./cup-model";
import { removeWhiteEdges } from "./logo-background";
import { paintDesign } from "./design-art";
import type { DesignSpec } from "./designs";
import type { CupBrand } from "./cup-preview";
import { fontFamily, logoStamps } from './print-options';
import { surfaceOpacity } from './cup-surface';
const images = new Map<string, Promise<HTMLImageElement>>();
export function loadCupImage(url: string) {
    let pending = images.get(url);
    if (!pending) {
        pending = new Promise<HTMLImageElement>((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => { images.delete(url); reject(Error("Could not read logo")); }; image.src = url; });
        images.set(url, pending);
        if (images.size > 12)
            images.delete(images.keys().next().value!);
    }
    return pending;
}
type ArtLayers = {
    decoration?: boolean;
    logo?: boolean;
    message?: boolean;
};
export async function cupArtwork(brand: CupBrand, product: CupProduct, design: DesignSpec, placement: PrintPlacement, knockout: boolean, surfaceAspect?: number, includeBackground = true, layers: ArtLayers = {}) {
    const profile = CUP_PROFILES[product.material];
    const logo = layers.logo !== false && brand.logo ? await loadCupImage(brand.logo) : null;
    await document.fonts?.ready;
    if (design.message && layers.message !== false)
        await document.fonts?.load(`500 35px "${fontFamily(design.messageFont)}"`);
    const art = document.createElement("canvas");
    art.width = 1024;
    art.height = 1024;
    const a = art.getContext("2d")!;
    const spec = design;
    const physicalAspect = surfaceAspect ?? (2.7 * (profile.radiusTop + profile.radiusBottom) / 2) / (profile.bottom - profile.top);
    if (layers.decoration !== false && spec.artwork) {
        const illustration = await loadCupImage(spec.artwork);
        a.drawImage(illustration, 0, 0, 1024, 1024);
        const pixels = a.getImageData(0, 0, 1024, 1024);
        pixels.data.set(removeWhiteEdges(pixels.data, 1024, 1024));
        const primary = [1, 3, 5].map(i => parseInt(spec.color.slice(i, i + 2), 16)), secondary = [1, 3, 5].map(i => parseInt(spec.accent.slice(i, i + 2), 16));
        for (let i = 0; i < pixels.data.length; i += 4) {
            if (!pixels.data[i + 3])
                continue;
            const light = (pixels.data[i] + pixels.data[i + 1] + pixels.data[i + 2]) / 765;
            const ink = light < .55 ? primary : secondary;
            pixels.data[i] = ink[0];
            pixels.data[i + 1] = ink[1];
            pixels.data[i + 2] = ink[2];
        }
        a.putImageData(pixels, 0, 0);
    }
    else if (layers.decoration !== false)
        paintDesign(a, spec, brand.mark, placement, physicalAspect);
    if (design.message) {
        a.save();
        a.globalCompositeOperation = 'destination-out';
        a.translate(512, 730);
        a.scale(1, .20);
        const halo = a.createRadialGradient(0, 0, 330, 0, 0, 420);
        halo.addColorStop(0, '#000');
        halo.addColorStop(1, '#0000');
        a.fillStyle = halo;
        a.fillRect(-420, -420, 840, 840);
        a.restore();
    }
    const cx = 512 + placement.horizontal * 5, cy = 510 + placement.vertical * 5;
    const scale = placement.scale / 100;
    a.save();
    a.translate(cx, cy);
    a.scale(scale, scale * physicalAspect);
    if (layers.logo !== false && logo) {
        let ink: CanvasImageSource = logo;
        if (knockout || design.logoColor) {
            const clean = document.createElement("canvas");
            const ratio = Math.min(1, 1200 / Math.max(logo.naturalWidth, logo.naturalHeight));
            clean.width = Math.max(1, Math.round(logo.naturalWidth * ratio));
            clean.height = Math.max(1, Math.round(logo.naturalHeight * ratio));
            const c = clean.getContext("2d")!;
            c.drawImage(logo, 0, 0, clean.width, clean.height);
            const pixels = c.getImageData(0, 0, clean.width, clean.height);
            if (knockout)
                pixels.data.set(removeWhiteEdges(pixels.data, clean.width, clean.height));
            c.putImageData(pixels, 0, 0);
            if (design.logoColor) {
                c.globalCompositeOperation = "source-in";
                c.fillStyle = design.logoColor;
                c.fillRect(0, 0, clean.width, clean.height);
            }
            ink = clean;
        }
        const width = 640, height = 400, fit = Math.min(width / logo.naturalWidth, height / logo.naturalHeight);
        a.drawImage(ink, -logo.naturalWidth * fit / 2, -logo.naturalHeight * fit / 2, logo.naturalWidth * fit, logo.naturalHeight * fit);
    }
    else if (layers.logo !== false) {
        a.textAlign = "center";
        a.textBaseline = "middle";
        a.fillStyle = design.logoColor ?? brand.color;
        a.font = `italic bold ${brand.mark.length > 10 ? 76 : 116}px Georgia`;
        a.fillText(brand.mark, 0, 0, 650);
    }
    a.restore();
    if (design.message && layers.message !== false) {
        a.save();
        a.translate(512, 730);
        a.scale(1, physicalAspect);
        a.fillStyle = design.messageColor ?? design.color;
        a.textAlign = "center";
        a.textBaseline = "middle";
        a.font = `500 35px "${fontFamily(design.messageFont)}"`;
        a.fillText(design.message, 0, 0, 780);
        a.restore();
    }
    // 3D PET applies its coating to the physical material, not to the logo texture.
    const alpha = surfaceOpacity(product.material, design.backgroundOpacity);
    if (includeBackground && alpha > 0) {
        a.save();
        a.globalCompositeOperation = "destination-over";
        a.globalAlpha = alpha;
        a.fillStyle = design.background ?? "#ffffff";
        a.fillRect(0, 0, 1024, 1024);
        a.restore();
    }
    return art;
}
export const WRAP_WIDTH = 2400, WRAP_HEIGHT = 1024;
function drawWrapped(ctx: CanvasRenderingContext2D, image: HTMLCanvasElement, cx: number, cy: number, width: number, height: number) {
    for (const offset of [-WRAP_WIDTH, 0, WRAP_WIDTH])
        ctx.drawImage(image, cx - width / 2 + offset, cy - height / 2, width, height);
}
export async function cupPrintLayers(brand: CupBrand, product: CupProduct, design: DesignSpec, placement: PrintPlacement, knockout: boolean, aspect: number) {
    const surface = document.createElement('canvas'), ink = document.createElement('canvas');
    surface.width = ink.width = WRAP_WIDTH;
    surface.height = ink.height = WRAP_HEIGHT;
    const s = surface.getContext('2d')!, p = ink.getContext('2d')!;
    const centered = { scale: 100, horizontal: 0, vertical: 0 };
    const [decoration, front, back, message] = await Promise.all([
        cupArtwork(brand, product, design, placement, knockout, aspect, false, { logo: false, message: false }),
        cupArtwork(brand, product, { ...design, message: '' }, centered, knockout, aspect, false, { decoration: false, message: false }),
        design.logoLayout === 'both' && design.backLogo ? cupArtwork({ ...brand, logo: design.backLogo }, product, { ...design, message: '' }, centered, knockout, aspect, false, { decoration: false, message: false }) : Promise.resolve(null),
        design.message ? cupArtwork(brand, product, design, placement, knockout, aspect, false, { decoration: false, logo: false }) : Promise.resolve(null),
    ]);
    for (let x = -336; x < WRAP_WIDTH; x += 1024)
        s.drawImage(decoration, x, 0);
    if (product.material !== 'clear') {
        s.globalCompositeOperation = 'destination-over';
        s.fillStyle = design.background ?? '#ffffff';
        s.fillRect(0, 0, WRAP_WIDTH, WRAP_HEIGHT);
    }
    for (const stamp of logoStamps(design.logoLayout)) {
        const scale = placement.scale / 100 * stamp.scale;
        drawWrapped(p, stamp.back && back ? back : front, stamp.u * WRAP_WIDTH + placement.horizontal * (design.logoLayout === 'repeat' ? 1.5 : 5), stamp.v * WRAP_HEIGHT + placement.vertical * (design.logoLayout === 'repeat' ? 1.5 : 5), 1024 * scale, 1024 * scale);
    }
    if (message) {
        drawWrapped(p, message, 1200, 512, 1024, 1024);
        if (design.logoLayout === 'both')
            drawWrapped(p, message, 0, 512, 1024, 1024);
    }
    return { surface, ink };
}
