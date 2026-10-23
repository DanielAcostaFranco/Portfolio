"use client";
import { useEffect, useState } from 'react';
import { CupPreview, type CupBrand } from './cup-preview';
import { initialBrandDirections, type DesignVariant } from './designs';
const conceptCache = new Map<string, {
    variants: DesignVariant[];
    source: string;
}>();
const placement = { scale: 90, horizontal: 0, vertical: 0 };
export function BrandDirections({ brand, onChoose, onUpload }: {
    brand: CupBrand;
    onChoose: (variant: DesignVariant) => void;
    onUpload: () => void;
}) {
    const brief = /juice|morrow|jugo/i.test(brand.name) ? 'Fresh summer citrus with organic movement' : /bake|luna|pan/i.test(brand.name) ? 'Elegant artisan bakery, minimal and editorial' : 'Contemporary coffee brand, refined and expressive';
    const [variants, setVariants] = useState(() => initialBrandDirections(brand.name,brand.color,brand.accent));
    const [source, setSource] = useState('Preparing directions…'), [busy, setBusy] = useState(true), [error, setError] = useState('');
    useEffect(() => {
        const key = brand.name + "|" + brand.logo;
        const cached = conceptCache.get(key);
        if (cached) {
            setVariants(cached.variants);
            setSource(cached.source);
            setBusy(false);
            return;
        }
        const controller = new AbortController();
        const timer = setTimeout(() => { fetch('/api/ai/design', { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ initial:true, prompt: 'Create three initial directions for ' + brand.name + '. ' + brief + '. Use the supplied brand palette, keep the approved logo unchanged, and explore distinct cup backgrounds and print styles.', brandName: brand.name, color: brand.color, accent: brand.accent, placement }) }).then(async (r) => { if (!r.headers.get("content-type")?.includes("application/json"))
            throw Error("The design service is temporarily unavailable."); const data = await r.json(); if (!r.ok)
            throw Error(data.error ?? 'Could not generate directions'); return data; }).then(data => { const label = data.source === 'gemini-image' ? 'AI artwork · Gemini' : data.source === 'gemini' ? 'Art direction · Gemini' : 'Studio preview · AI not connected'; const generated = Array.isArray(data.variants) ? data.variants : []; const plain = generated[0] ? { ...generated[0], design: { ...generated[0].design, id: 'default-pure', name: 'Pure', pattern: 'pure', background: '#ffffff', density: 0 } } : initialBrandDirections(brand.name, brand.color, brand.accent)[0]; const variants = [plain, ...generated.slice(1)]; setVariants(variants); setSource(label); conceptCache.set(key, { variants, source: label }); if (conceptCache.size > 3)
            conceptCache.delete(conceptCache.keys().next().value!); }).catch(e => { if (!controller.signal.aborted) {
            setSource('Studio preview · not AI-generated');
            setError(e.message);
        } }).finally(() => { if (!controller.signal.aborted)
            setBusy(false); }); }, 0);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [brand.name, brand.color, brand.accent, brief]);
    return <section className="brand-directions" aria-label="Brand directions"><div className="concept-heading"><h2>Choose a direction.</h2><p aria-live="polite">{source}</p></div>{!brand.logo && <p className="concept-source">Your URL is a name placeholder, not a brand analysis. <button onClick={onUpload}>Add your logo</button> for your colors.</p>}<div className="brand-palette"><span style={{ background: brand.color }}/><span style={{ background: brand.accent }}/><small>{brand.logo ? 'Palette from your logo' : 'Starting palette'}</small></div>{error && <p className="error" role="alert">{error} Local previews are available below.</p>}<div className="variation-grid" aria-busy={busy}>{variants.map((variant, i) => <article className="variation-card" key={variant.design.id}><CupPreview brand={brand} product={{ material: 'paper', size: 12 }} design={variant.design} placement={variant.placement} knockout resolution={800}/><div className="variation-copy"><span className="concept-number">0{i + 1}</span><h3>{variant.design.name.split(' · ').pop()}</h3><button className="dark-button full" disabled={busy} onClick={() => onChoose(variant)}>{busy ? 'Preparing…' : 'Customize in 3D →'}</button></div></article>)}</div></section>;
}
