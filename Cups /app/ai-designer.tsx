"use client";
import { useEffect, useRef, useState } from "react";
import { retainPrintOptions } from "./print-options";
import { CupPreview, type CupBrand } from "./cup-preview";
import type { CupProduct, PrintPlacement } from "./cup-model";
import type { DesignSpec, DesignVariant } from "./designs";
const ideas = ["Christmas with pines, candy ribbons and a cream background", "Summer citrus in the brand palette", "Botanical, earthy colors, smaller logo", "Retro café with a checkerboard base", "Elegant, subtle, with the logo higher"];
export function AiDesigner({ open, onClose, brand, product, design, placement, knockout, onApply }: {
    open: boolean;
    onClose: () => void;
    brand: CupBrand;
    product: CupProduct;
    design: DesignSpec;
    placement: PrintPlacement;
    knockout: boolean;
    onApply: (variant: DesignVariant) => void;
}) {
    const [illustrations, setIllustrations] = useState(false);
    const [prompt, setPrompt] = useState(""), [mode, setMode] = useState<"loading" | "demo" | "gemini">("loading"), [busy, setBusy] = useState(false), [error, setError] = useState(""), [variants, setVariants] = useState<DesignVariant[]>([]), [source, setSource] = useState(""), [selected, setSelected] = useState<number | null>(null);
    const panel = useRef<HTMLElement>(null), abort = useRef<AbortController | null>(null), resultRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open)
            return;
        const controller = new AbortController();
        fetch("/api/ai/design", { signal: controller.signal }).then(r => r.json()).then(data => { setMode(data.mode === "gemini" ? "gemini" : "demo"); setIllustrations(Boolean(data.illustrations)); }).catch(() => {
            if (!controller.signal.aborted)
                setMode("demo");
        });
        panel.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        return () => { controller.abort(); abort.current?.abort(); };
    }, [open]);
    async function generate(preview = false) {
        abort.current?.abort();
        const controller = new AbortController();
        abort.current = controller;
        setBusy(true);
        setError("");
        try {
            const response = await fetch("/api/ai/design", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, preview, brandName: brand.name, color: design.color, accent: design.accent, pattern: design.pattern, background: design.background, placement }) });
            if (!response.headers.get("content-type")?.includes("application/json"))
                throw Error("The design service is temporarily unavailable.");
            const data = await response.json();
            if (!response.ok)
                throw Error(data.error || "Could not create variations.");
            if (!Array.isArray(data.variants) || data.variants.length !== 3)
                throw Error("Could not create variations.");
            setVariants(data.variants.map((v: DesignVariant) => ({ ...v, design: retainPrintOptions({ ...v.design, backgroundOpacity: design.backgroundOpacity, message: design.message, messageColor: design.messageColor }, design) })));
            setSource(data.source);
            setSelected(null);
            requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
        }
        catch (e) {
            if (!controller.signal.aborted)
                setError(e instanceof Error ? e.message : "Could not create variations.");
        }
        finally {
            if (!controller.signal.aborted)
                setBusy(false);
        }
    }
    if (!open)
        return null;
    return <section className="ai-workbench" ref={panel} aria-label="Improve with AI"><div className="ai-heading"><div><span className="ai-star" aria-hidden="true">✧</span><h2>Improve with AI</h2></div><button className="quiet-button" onClick={onClose}>Close ×</button></div><p className="ai-intro">Describe your idea. Explore three directions.</p><form onSubmit={e => { e.preventDefault(); void generate(); }}><label className="visually-hidden" htmlFor="design-brief">Describe your changes</label><textarea id="design-brief" placeholder="A botanical look in sage green, with a smaller logo a little higher…" value={prompt} maxLength={1000} onChange={e => setPrompt(e.target.value)} required minLength={4}/><div className="prompt-ideas">{ideas.map(idea => <button type="button" key={idea} onClick={() => setPrompt(idea)}>{idea} ↗</button>)}</div><div className="ai-submit-row"><p className="ai-mode">{mode === "gemini" ? illustrations ? "Gemini illustrations · original artwork from your brief and colors. Your logo stays here." : "Gemini art direction · library compositions. Original illustrations require an image model. Your logo stays here." : mode === "loading" ? "Checking connection…" : "Studio preview · Gemini is not connected. Variations use local design rules."}</p><button className="dark-button ai-generate" disabled={busy || prompt.trim().length < 4 || mode === "loading"}>{busy ? "Creating three directions…" : mode === "gemini" ? "Generate variations ✧" : "Preview variations ✧"}</button></div></form>{error && <div role="alert" className="ai-error"><p>{error}</p><button className="quiet-button" disabled={busy} onClick={() => void generate(true)}>Use studio preview</button></div>}{busy && <div role="status" className="ai-loading"><span />Exploring your brief, palette, and cup…</div>}{variants.length > 0 && <div className="ai-results" ref={resultRef} aria-busy={busy}><div className="results-heading"><h3>Your directions</h3><span>{source === "gemini-image" ? "Original artwork · Gemini" : source === "gemini" ? "Art direction · Gemini" : "Studio preview · not AI-generated"}</span></div><div className="variation-grid">{variants.map((v, i) => <article key={`${v.design.id}-${v.design.name}-${i}`} className={selected === i ? "variation-card applied" : "variation-card"}><CupPreview brand={brand} product={product} design={v.design} placement={v.placement} knockout={knockout} resolution={560}/><div className="variation-copy"><h3>{v.design.name}</h3><p>{v.reason}</p><div className="variation-palette"><i style={{ background: v.design.color }}/><i style={{ background: v.design.accent }}/><span>Logo {v.placement.scale}% · {v.placement.vertical < 0 ? "raised" : v.placement.vertical > 0 ? "lowered" : "centered"}</span></div><button className={selected === i ? "quiet-button full" : "dark-button full"} disabled={selected === i} onClick={() => { setSelected(i); onApply(v); }}>{selected === i ? "Applied ✓" : "Use this direction →"}</button></div></article>)}</div></div>}</section>;
}
