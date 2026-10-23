import type { PrintPlacement } from "./cup-model";
import { seasonFromBrief } from "./studio-options";
import type { PrintOptions } from './print-options';
export const PATTERNS = ["pure", "heritage", "tidal", "contour", "botanical", "sunrise", "confetti", "checker", "monogram", "arch", "noir", "terrazzo", "holiday", "summer", "valentine", "halloween"] as const;
export type Pattern = typeof PATTERNS[number];
export type DesignSpec = PrintOptions & {
    id: string;
    name: string;
    pattern: Pattern;
    color: string;
    accent: string;
    density: number;
    background?: string;
    backgroundOpacity?: number;
    message?: string;
    messageColor?: string;
    artwork?: string;
};
export type DesignVariant = {
    design: DesignSpec;
    placement: PrintPlacement;
    reason: string;
};
export const STYLE_CATALOG: {
    name: string;
    pattern: Pattern;
    family: string;
}[] = [
    { name: "Pure", pattern: "pure", family: "Quiet" }, { name: "Heritage", pattern: "heritage", family: "Quiet" },
    { name: "Botanical", pattern: "botanical", family: "Organic" }, { name: "Tidal", pattern: "tidal", family: "Organic" },
    { name: "Topography", pattern: "contour", family: "Organic" }, { name: "Daybreak", pattern: "sunrise", family: "Organic" },
    { name: "Playful", pattern: "confetti", family: "Bold" }, { name: "Checkers", pattern: "checker", family: "Bold" },
    { name: "Monogram", pattern: "monogram", family: "Quiet" }, { name: "Arc", pattern: "arch", family: "Quiet" },
    { name: "Afterhours", pattern: "noir", family: "Bold" }, { name: "Terrazzo", pattern: "terrazzo", family: "Bold" },
];
export function catalogDesign(index: number, color: string, accent: string): DesignSpec { const item = STYLE_CATALOG[index] ?? STYLE_CATALOG[0]; return { id: `studio-${item.pattern}`, name: item.name, pattern: item.pattern, color, accent, density: .65 }; }
export function initialBrandDirections(name:string,color:string,accent:string):DesignVariant[]{
    const brief=/juice|morrow|jugo/i.test(name)?'Botanical, fresh and expressive':/bake|luna|pan/i.test(name)?'Elegant artisan bakery, minimal and editorial':'Retro coffee, contemporary and refined';
    const tint=(hex:string)=>'#'+[1,3,5].map(i=>Math.round(parseInt(hex.slice(i,i+2),16)*.18+255*.82).toString(16).padStart(2,'0')).join('');
    return demoVariations(brief,catalogDesign(0,color,accent),{scale:90,horizontal:0,vertical:0}).map((v,i)=>({...v,design:{...v.design,background:i===0?'#ffffff':i===1?tint(accent):tint(color)}}));
}
export function clampPlacement(p: PrintPlacement): PrintPlacement { return { scale: Math.max(35, Math.min(150, p.scale)), vertical: Math.max(-40, Math.min(40, p.vertical)), horizontal: Math.max(-30, Math.min(30, p.horizontal)) }; }
export function validateVariants(input: unknown): DesignVariant[] {
    if (!input || typeof input !== "object" || !("variants" in input) || !Array.isArray(input.variants) || input.variants.length !== 3)
        throw Error("Expected three design variations");
    const variants = input.variants.map((raw: unknown, index: number) => {
        if (!raw || typeof raw !== "object")
            throw Error("Invalid variation");
        const v = raw as Record<string, unknown>;
        const bounded = (key: string, min: number, max: number) => typeof v[key] === "number" && Number.isFinite(v[key]) && (v[key] as number) >= min && (v[key] as number) <= max;
        if (typeof v.name !== "string" || v.name.trim().length < 1 || v.name.length > 48 || typeof v.pattern !== "string" || !PATTERNS.includes(v.pattern as Pattern) || typeof v.color !== "string" || !/^#[0-9a-f]{6}$/i.test(v.color) || typeof v.accent !== "string" || !/^#[0-9a-f]{6}$/i.test(v.accent) || typeof v.reason !== "string" || v.reason.length > 220 || !bounded("density", .15, 1) || !bounded("scale", 35, 150) || !bounded("horizontal", -30, 30) || !bounded("vertical", -40, 40))
            throw Error("Invalid design values");
        if (v.background !== undefined && (typeof v.background !== "string" || !/^#[0-9a-f]{6}$/i.test(v.background)))
            throw Error("Invalid cup background");
        return { design: { background: typeof v.background === "string" ? v.background : "#ffffff", id: `variation-${index}`, name: v.name.trim(), pattern: v.pattern as Pattern, color: v.color, accent: v.accent, density: v.density as number }, placement: { scale: v.scale as number, horizontal: v.horizontal as number, vertical: v.vertical as number }, reason: v.reason };
    });
    const fingerprints = variants.map(v => JSON.stringify([v.design.pattern, v.design.color, v.design.accent, v.design.density, v.placement]));
    if (new Set(fingerprints).size !== 3)
        throw Error("Expected distinct design variations");
    return variants;
}
export function demoVariations(prompt: string, base: DesignSpec, placement: PrintPlacement): DesignVariant[] {
    const p = prompt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const groups: {
        match: RegExp;
        patterns: Pattern[];
    }[] = [
        { match: /christmas|holiday|navidad|winter|invierno/, patterns: ["holiday", "heritage", "botanical"] },
        { match: /summer|verano|citrus|playa/, patterns: ["summer", "sunrise", "tidal"] },
        { match: /valentine|valentin|romantic|amor/, patterns: ["valentine", "botanical", "arch"] },
        { match: /halloween|spooky|calabaza/, patterns: ["halloween", "noir", "checker"] },
        { match: /botanic|floral|hojas|natur|jungle|selva|tropic/, patterns: ["botanical", "contour", "tidal"] },
        { match: /retro|vintage|checker|cuadros|diner/, patterns: ["checker", "sunrise", "heritage"] },
        { match: /playful|divertid|fiesta|colorful|confetti|alegr/, patterns: ["confetti", "terrazzo", "checker"] },
        { match: /elegan|luxur|premium|lujo|sutil|minimal/, patterns: ["heritage", "arch", "pure"] },
        { match: /wave|olas|mar|ocean|agua/, patterns: ["tidal", "contour", "sunrise"] },
        { match: /dark|black|negro|noche/, patterns: ["noir", "arch", "heritage"] },
    ];
    const choices = groups.find(g => g.match.test(p))?.patterns ?? [base.pattern, "botanical", "contour"];
    const season = seasonFromBrief(prompt);
    const patterns: Pattern[] = season !== "none" ? [season, season, season] : [...new Set<Pattern>([...choices, "arch", "terrazzo"])].slice(0, 3);
    let color = base.color, accent = base.accent;
    const hex = prompt.match(/#[0-9a-f]{6}\b/gi);
    if (hex) {
        color = hex[0];
        if (hex[1])
            accent = hex[1];
    }
    else if (/green|verde|sage|salvia/.test(p))
        color = "#66745a";
    else if (/blue|azul/.test(p))
        color = "#315e83";
    else if (/pink|rosa/.test(p))
        color = "#ba6f83";
    else if (/red|rojo/.test(p))
        color = "#b23829";
    else if (/black|negro/.test(p))
        color = "#292722";
    let target = { ...placement };
    if (/smaller|chic[oa]|pequen|mas pequeno/.test(p))
        target.scale = 65;
    if (/bigger|larger|grande/.test(p))
        target.scale = 130;
    if (/higher|arriba|subir|alto/.test(p))
        target.vertical = -24;
    if (/lower|abajo|bajar/.test(p))
        target.vertical = 24;
    const density = /sutil|subtle|minimal/.test(p) ? .3 : /bold|llamativ|atrevid/.test(p) ? .95 : .65;
    return patterns.map((pattern, i) => ({ design: { id: `preview-${i}`, name: ["Refined", "Expressive", "Unexpected"][i] + " · " + (STYLE_CATALOG.find(s => s.pattern === pattern)?.name ?? pattern), pattern, color, accent, background: base.background ?? "#ffffff", message: base.message ?? "", messageColor: base.messageColor ?? color, density: Math.min(1, density + (i - 1) * .12) }, placement: clampPlacement({ ...target, scale: target.scale + (i - 1) * 8 }), reason: ["A quieter composition with more room around the mark.", "More movement in the print, with your logo kept intact.", "An alternative visual rhythm using the same palette."][i] }));
}
export const variationSchema = { type: "object", properties: { variants: { type: "array", minItems: 3, maxItems: 3, items: { type: "object", properties: { name: { type: "string" }, pattern: { type: "string", enum: [...PATTERNS] }, color: { type: "string" }, accent: { type: "string" }, background: { type: "string", description: "Cup body background as a six-digit hex color. Keep the logo legible." }, density: { type: "number", minimum: .15, maximum: 1 }, scale: { type: "number", minimum: 35, maximum: 150 }, horizontal: { type: "number", minimum: -30, maximum: 30 }, vertical: { type: "number", minimum: -40, maximum: 40 }, reason: { type: "string" } }, required: ["name", "pattern", "color", "accent", "background", "density", "scale", "horizontal", "vertical", "reason"], additionalProperties: false } } }, required: ["variants"], additionalProperties: false };
