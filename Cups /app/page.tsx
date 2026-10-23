"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { estimate, money } from "./pricing";
import { STYLE_CATALOG, catalogDesign, clampPlacement, type DesignSpec, type DesignVariant } from "./designs";
import { DesignSwatch } from "./design-swatch";
import { AiDesigner } from "./ai-designer";
import dynamic from "next/dynamic";
import { BrandDirections } from "./brand-directions";
import type { PrintOptions } from "./print-options";
import { SurfaceControls } from "./surface-controls";
import { DEFAULT_SURFACE, paletteFromPixels, validateLogoSvg, type Season } from "./studio-options";
import { CupPreview } from "./cup-preview";
import { CUP_PROFILES, selectMaterial, productLabel, cupPrice, type CupProduct, type Material, type PrintPlacement } from "./cup-model";
import { ProspectFinder } from './prospect-finder';
import type { Prospect } from './prospecting';
type Brand = {
    name: string;
    mark: string;
    color: string;
    accent: string;
    logo: string;
    demo: boolean;
};
type LogoChoice = { src: string; label: string; kind: 'brand' | 'social' | 'icon' };
const Cup3D = dynamic(() => import('./cup-3d').then(module => module.Cup3D), { ssr: false, loading: () => <div className="three-mount" aria-busy="true"/> });
const demos: Brand[] = [{ name: "Sunday Coffee", mark: "sunday", color: "#b73825", accent: "#f8e9cf", logo: "/logos/sunday.svg", demo: true }, { name: "Morrow Juice", mark: "morrow.", color: "#dfac32", accent: "#2b2821", logo: "/logos/morrow.svg", demo: true }, { name: "Luna Bakehouse", mark: "luna", color: "#51465d", accent: "#f3dfd0", logo: "/logos/luna.svg", demo: true }];
const directions = STYLE_CATALOG.map(s => s.name);
type Step = "start" | "concepts" | "design" | "proposal" | "email";
function Arrow() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>; }
export default function Home() {
    const [step, setStep] = useState<Step>("start"), [mode, setMode] = useState("url"), [url, setUrl] = useState(""), [brand, setBrand] = useState<Brand>(demos[0]), [demoOpen, setDemoOpen] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState(""), [busy, setBusy] = useState(false), [direction, setDirection] = useState(0), [edit, setEdit] = useState(false), [enlarged, setEnlarged] = useState(false), [quantity, setQuantity] = useState(1000), [unit, setUnit] = useState(31), [discount, setDiscount] = useState(10), [recurring, setRecurring] = useState(false), [recipient, setRecipient] = useState(""), [approved, setApproved] = useState(false), [customMessage, setCustomMessage] = useState<string | null>(null);
    const [logoChoices, setLogoChoices] = useState<LogoChoice[]>([]), [siteName, setSiteName] = useState(""), [pendingUrl, setPendingUrl] = useState(""), [prospecting, setProspecting] = useState(false);
    const [knockout, setKnockout] = useState(true);
    const [surface, setSurface] = useState({ background: DEFAULT_SURFACE.background, message: "", messageColor: DEFAULT_SURFACE.messageColor });
    const [printOptions, setPrintOptions] = useState<PrintOptions>({ lid: false, logoLayout: "front" });
    const [backgroundOpacity, setBackgroundOpacity] = useState<number | undefined>(undefined);
    const [aiOpen, setAiOpen] = useState(false);
    const [customDesign, setCustomDesign] = useState<DesignSpec | null>(null);
    const activeDesign = useMemo(() => ({ ...(customDesign ?? catalogDesign(direction, brand.color, brand.accent)), color: brand.color, accent: brand.accent, ...surface, backgroundOpacity, ...printOptions }), [customDesign, direction, brand.color, brand.accent, surface, backgroundOpacity, printOptions]);
    const [product, setProduct] = useState<CupProduct>({ material: "paper", size: 12 });
    const [placement, setPlacement] = useState<PrintPlacement>({ scale: 100, horizontal: 0, vertical: 0 });
    function chooseProduct(next: CupProduct) { setProduct(next); setUnit(cupPrice(next)); setApproved(false); }
    const fileInput = useRef<HTMLInputElement>(null), preview = useRef<HTMLDivElement>(null);
    const quote = estimate(quantity, unit, recurring ? discount : 0);
    const subject = `Custom cups for ${brand.name} · a concept to review`;
    const message = customMessage ?? `Hello,\n\nWe are cup suppliers and created this concept to show how ${brand.name} could look on a professionally printed ${productLabel(product)}.\n\nWe would love to show you the style and explore a cup program that fits your brand. For reference, the sample quote is ${quantity.toLocaleString()} ${productLabel(product)}s at ${money(quote.total)}${recurring ? " per monthly delivery" : ""}. Shipping and tax are still to be confirmed.\n\nWould you be open to a quick conversation? Reply to this email and we can review sizes, materials, quantities, and the final artwork together.\n\nBest,\nCustom Cup Studio`;
    const dialogRef = useRef<HTMLDialogElement>(null);
    useEffect(() => {
        if (enlarged)
            dialogRef.current?.showModal();
    }, [enlarged]);
    function go(s: Step) { setStep(s); setError(""); setNotice(""); setApproved(false); window.scrollTo({ top: 0, behavior: "smooth" }); }
    function start(b: Brand) { setPrintOptions({ lid: false, logoLayout: "front" }); setBackgroundOpacity(undefined); setAiOpen(false); setCustomDesign(null); setBrand(b); setDirection(0); setPlacement({ scale: 100, horizontal: 0, vertical: 0 }); setKnockout(true); setSurface({ background: "#ffffff", message: "", messageColor: b.color }); setCustomMessage(null); setRecipient(""); setEdit(false); setDemoOpen(false); go("concepts"); }
    function openProspect(prospect: Prospect, logo = "", recipient = "") { const name = prospect.name; setUrl(prospect.website); start({ ...demos[0], name, mark: name.slice(0, 14), logo, demo: false }); setRecipient(recipient); setProspecting(false); }
    async function openUrl(e: React.FormEvent) {
        e.preventDefault();
        try {
            const parsed = new URL(url.includes("://") ? url : `https://${url}`);
            if (!/^https?:$/.test(parsed.protocol) || !parsed.hostname.includes(".") || parsed.username || parsed.password)
                throw Error();
            setBusy(true); setError(""); setLogoChoices([]);
            const response = await fetch('/api/brand/inspect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: parsed.toString() }) });
            const data = await response.json();
            if (!response.ok) throw Error(data.error ?? 'Could not read website.');
            const name = String(data.name || parsed.hostname.replace(/^www\./, '').split('.')[0]).trim();
            const choices = (data.candidates ?? []) as LogoChoice[];
            setSiteName(name); setPendingUrl(parsed.toString());
            if (choices.length) setLogoChoices(choices);
            else start({ ...demos[0], name, mark: name.slice(0, 14), logo: "", demo: false });
        }
        catch (e) {
            setError(e instanceof Error && e.message.includes('valid') ? e.message : "We couldn't read that site. You can upload the logo instead.");
        }
        finally {
            setBusy(false);
        }
    }
    async function chooseDiscoveredLogo(choice: LogoChoice) {
        setBusy(true); setError("");
        try {
            const image = await new Promise<HTMLImageElement>((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = choice.src; });
            const sample = document.createElement('canvas'); sample.width = sample.height = 64;
            const context = sample.getContext('2d')!; const fit = Math.min(64 / image.naturalWidth, 64 / image.naturalHeight); context.drawImage(image, 0, 0, image.naturalWidth * fit, image.naturalHeight * fit);
            const [color, accent] = paletteFromPixels(context.getImageData(0, 0, 64, 64).data);
            start({ ...demos[0], name: siteName, mark: siteName.slice(0, 14), logo: choice.src, color, accent, demo: false });
            setLogoChoices([]); setPendingUrl('');
        }
        catch { setError('That logo could not be prepared. Choose another candidate or upload it manually.'); }
        finally { setBusy(false); }
    }
    async function upload(file?: File) {
        if (!file)
            return;
        if (!["image/png", "image/svg+xml", "image/jpeg", "image/webp"].includes(file.type)) {
            setError("Choose a transparent PNG or SVG logo. JPG and WebP also work.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("Choose an image smaller than 5 MB.");
            return;
        }
        setBusy(true);
        setError("");
        try {
            if (file.type === "image/svg+xml")
                validateLogoSvg((await file.text()).replace(/<\?xml[^>]*\?>/g, "").trim());
            const logo = await new Promise<string>((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = reject; r.readAsDataURL(file); });
            const image = await new Promise<HTMLImageElement>((resolve, reject) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = reject; i.src = logo; });
            const sample = document.createElement("canvas");
            sample.width = sample.height = 64;
            const context = sample.getContext("2d")!;
            const fit = Math.min(64 / image.naturalWidth, 64 / image.naturalHeight);
            context.drawImage(image, 0, 0, image.naturalWidth * fit, image.naturalHeight * fit);
            const [color, accent] = paletteFromPixels(context.getImageData(0, 0, 64, 64).data);
            if (step === "start" || step === "concepts")
                start({ ...demos[0], name: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "), mark: file.name.replace(/\.[^.]+$/, "").slice(0, 14), logo, color, accent, demo: false });
            else
                setBrand(b => ({ ...b, logo, color, accent }));
        }
        catch {
            setError("Could not open that image. Try another file.");
        }
        finally {
            setBusy(false);
            if (fileInput.current)
                fileInput.current.value = "";
        }
    }
    async function download() {
        setBusy(true);
        try {
            const canvas = preview.current?.querySelector("canvas");
            if (!canvas || canvas.dataset.ready !== "true")
                throw Error();
            const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(Error()), "image/png"));
            const url = URL.createObjectURL(blob), a = document.createElement("a");
            a.href = url;
            a.download = `${brand.name}-${product.material}-${product.size}oz-concept.png`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            setNotice("Cup concept downloaded.");
        }
        catch {
            setError("The preview is still rendering. Try the download again in a moment.");
        }
        finally {
            setBusy(false);
        }
    }
    async function copy() {
        try {
            await navigator.clipboard.writeText(`To: ${recipient}\nSubject: ${subject}\n\n${message}`);
            setNotice("Email copied.");
        }
        catch {
            setError("Clipboard unavailable. Select and copy the message.");
        }
    }
    return <main className="studio"><header className="studio-header"><button className="wordmark" onClick={() => go("start")} aria-label="Custom Cup Studio home"><span className="brand-icon"><svg width="17" height="19" viewBox="0 0 24 26" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 7h16l-2 16H6L4 7ZM3 3h18v4H3z"/></svg></span>Custom Cup <span>Studio</span></button>{step !== "start" && <nav aria-label="Progress">{(["design", "proposal", "email"] as Step[]).map((s, i) => <button key={s} className={step === s || (step === "concepts" && s === "design") ? "current" : ""} disabled={i > (["design", "proposal", "email"] as Step[]).indexOf(step)} aria-current={step === s || (step === "concepts" && s === "design") ? "step" : undefined} onClick={() => go(s)}>{i + 1}<span>{["Designs", "Proposal", "Outreach"][i]}</span></button>)}</nav>}<span className="header-end">{step === "start" ? "" : brand.demo ? "Demo" : "Unofficial concept"}</span></header><input className="visually-hidden" ref={fileInput} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" aria-label="Choose logo file" onChange={e => void upload(e.target.files?.[0])}/>
 {step === "start" && (prospecting ? <ProspectFinder onOpen={openProspect}/> : <section className="entry"><div className="entry-inner"><p className="entry-symbol" aria-hidden="true">✦</p><h1>Start with a brand</h1><div className="entry-tabs"><button type="button" aria-pressed={mode === "url"} onClick={() => setMode("url")}>Paste URL</button><button type="button" aria-pressed={mode === "upload"} onClick={() => setMode("upload")}>Upload logo</button></div>{mode === "url" ? <form className="url-entry" onSubmit={openUrl}><input aria-label="Business website" placeholder="yourbusiness.com" value={url} onChange={e => setUrl(e.target.value)} /><button className="icon-submit" disabled={busy} aria-label="Continue">{busy ? "…" : "→"}</button></form> : <button className="upload-entry" type="button" onClick={() => fileInput.current?.click()}><span>＋</span><strong>Upload a logo</strong><small>PNG, SVG, JPG or WebP</small></button>}<button className="demo-link" type="button" onClick={() => setDemoOpen(value => !value)}>Explore a demo <span>↗</span></button>{demoOpen && <div className="demo-list">{demos.map(demo => <button type="button" key={demo.name} onClick={() => start(demo)}><span className="demo-mark" style={{ background: demo.accent, color: demo.color }}>{demo.mark.slice(0, 1).toUpperCase()}</span><span>{demo.name}<small>Open cup studio</small></span><span>→</span></button>)}</div>}<button className="quiet-button full" type="button" onClick={() => setProspecting(true)}>Send proposals to local businesses →</button>{error && <p className="error" role="alert">{error}</p>}{logoChoices.length > 0 && <div className="demo-list"><small>Choose a logo found on {pendingUrl}</small>{logoChoices.map(choice => <button type="button" key={choice.src} onClick={() => void chooseDiscoveredLogo(choice)}><img src={choice.src} alt="" width="36" height="36"/><span>{choice.label}<small>Use this logo</small></span><span>→</span></button>)}</div>}</div></section>)}
 {step === "concepts" && <BrandDirections key={brand.logo + brand.name} brand={brand} onUpload={() => fileInput.current?.click()} onChoose={variant => { setCustomDesign(variant.design); setPlacement(variant.placement); setBrand({ ...brand, color: variant.design.color, accent: variant.design.accent }); setSurface({ background: variant.design.background ?? "#ffffff", message: "", messageColor: variant.design.color }); go("design"); }}/>} 
 {step === "design" && <>{edit && <section className="brand-editor" aria-label="Edit brand"><label>Business name<input value={brand.name} onChange={e => setBrand({ ...brand, name: e.target.value })}/></label><label>Text mark<input value={brand.mark} maxLength={14} onChange={e => setBrand({ ...brand, mark: e.target.value })}/></label><label className="color-label">Brand color<input type="color" value={brand.color} onChange={e => setBrand({ ...brand, color: e.target.value })}/></label><label className="color-label">Accent<input type="color" value={brand.accent} onChange={e => setBrand({ ...brand, accent: e.target.value })}/></label><button className="quiet-button" onClick={() => fileInput.current?.click()}>Replace logo</button>{brand.logo && <button className="quiet-button" onClick={() => setBrand({ ...brand, logo: "" })}>Use text mark</button>}<button className="dark-button" onClick={() => setEdit(false)}>Done</button></section>}{!brand.demo && !brand.logo && <p className="source-note">Text placeholder from your URL. Add your logo in Edit brand.</p>}<div className="design-layout"><div className="main-preview" ref={preview}><button className="expand" aria-label="Enlarge 3D concept" onClick={() => setEnlarged(true)}>↗</button><Cup3D design={activeDesign} knockout={knockout} product={product} placement={placement} brand={brand}/><div className="preview-bottom"><span>{productLabel(product)}</span><span>{activeDesign.name}</span></div></div><aside className="design-rail"><fieldset className="cup-materials"><legend>Material</legend>{(["paper", "foam", "clear"] as Material[]).map(material => <button key={material} className={product.material === material ? "active" : ""} aria-pressed={product.material === material} onClick={() => chooseProduct(selectMaterial(material, product.size))}><img src={CUP_PROFILES[material].asset} alt=""/><span>{CUP_PROFILES[material].label}</span></button>)}</fieldset><fieldset className="cup-sizes"><legend>Size</legend>{CUP_PROFILES[product.material].sizes.map(size => <button key={size} aria-pressed={product.size === size} className={product.size === size ? "active" : ""} onClick={() => chooseProduct({ ...product, size })}>{size} oz</button>)}</fieldset><SurfaceControls originalColor={brand.color} material={product.material} design={activeDesign} onChange={values => { setPrintOptions(s => ({ ...s, ...Object.fromEntries(Object.entries(values).filter(([key]) => ["lid", "logoLayout", "logoColor", "backLogo", "messageFont"].includes(key))) })); if (values.backgroundOpacity !== undefined)
            setBackgroundOpacity(values.backgroundOpacity); setCustomDesign({ ...activeDesign, ...values }); setBrand(b => ({ ...b, color: values.color ?? b.color, accent: values.accent ?? b.accent })); setSurface(s => ({ ...s, background: values.background ?? s.background, message: values.message ?? s.message, messageColor: values.messageColor ?? s.messageColor })); }} onSeason={(season: Season) => { setCustomDesign({ ...activeDesign, artwork: undefined, pattern: season === "none" ? "pure" : season, name: season === "none" ? "Pure" : season.charAt(0).toUpperCase() + season.slice(1) }); }}/><section className="logo-controls" aria-label="Logo placement"><label htmlFor="logo-scale">Logo size <output>{placement.scale}%</output></label><div className="scale-control"><button aria-label="Smaller logo" onClick={() => setPlacement(clampPlacement({ ...placement, scale: placement.scale - 5 }))}>−</button><input id="logo-scale" aria-label="Logo size" type="range" min="35" max="150" value={placement.scale} onChange={e => setPlacement({ ...placement, scale: Number(e.target.value) })}/><button aria-label="Larger logo" onClick={() => setPlacement(clampPlacement({ ...placement, scale: placement.scale + 5 }))}>+</button></div><label htmlFor="logo-height">Logo height <output>{placement.vertical === 0 ? "Centered" : placement.vertical < 0 ? "↑ " + Math.abs(placement.vertical) : "↓ " + placement.vertical}</output></label><input id="logo-height" aria-label="Logo height" type="range" min="-40" max="40" value={-placement.vertical} onChange={e => setPlacement({ ...placement, vertical: -Number(e.target.value) })}/><div className="height-actions"><button onClick={() => setPlacement(clampPlacement({ ...placement, vertical: placement.vertical - 5 }))}>↑ Higher</button><button onClick={() => setPlacement({ ...placement, vertical: 0, horizontal: 0 })}>Center</button><button onClick={() => setPlacement(clampPlacement({ ...placement, vertical: placement.vertical + 5 }))}>↓ Lower</button></div><details className="placement-controls"><summary>More adjustments<span>+</span></summary><label>Horizontal<input aria-label="Logo horizontal position" type="range" min="-30" max="30" value={placement.horizontal} onChange={e => setPlacement({ ...placement, horizontal: Number(e.target.value) })}/></label>{brand.logo && <label className="knockout-option"><input type="checkbox" checked={knockout} onChange={e => setKnockout(e.target.checked)}/>Remove white background</label>}<button className="reset-placement" onClick={() => setPlacement({ scale: 100, horizontal: 0, vertical: 0 })}>Reset position</button></details></section><div className="rail-title style-library-title">Explore styles<span>12</span></div><div className="direction-list">{directions.map((name, i) => <button key={name} className={`direction-option ${direction === i && !customDesign ? "selected" : ""}`} aria-pressed={direction === i && !customDesign} onClick={() => { setCustomDesign(null); setDirection(i); }}><DesignSwatch design={catalogDesign(i, brand.color, brand.accent)} mark={brand.mark}/><span>{name}</span><span className="selection-dot">{direction === i && !customDesign ? "✓" : ""}</span></button>)}</div><button className="dark-button full" onClick={() => go("proposal")}>Build proposal <Arrow /></button><button className="quiet-button full" disabled={busy} onClick={() => void download()}>{busy ? "Preparing…" : "Download concept"} ↓</button><p className="fine-print">{brand.demo ? "Fictional demo brand. " : "Unofficial concept. "}Design review required before production.</p></aside></div><AiDesigner open={aiOpen} onClose={() => setAiOpen(false)} brand={brand} product={product} design={activeDesign} placement={placement} knockout={knockout} onApply={(variant: DesignVariant) => { setCustomDesign(variant.design); setSurface(s => ({ ...s, background: variant.design.background ?? s.background })); setPlacement(variant.placement); setBrand({ ...brand, color: variant.design.color, accent: variant.design.accent }); setApproved(false); setNotice("Direction applied. Adjust it to make it yours."); window.scrollTo({ top: 0, behavior: "smooth" }); }}/></>}
 {step === "proposal" && <div className="quote-layout"><div className="quote-preview"><CupPreview design={activeDesign} knockout={knockout} product={product} placement={placement} brand={brand} direction={direction}/><span>{brand.name} · {productLabel(product)}</span></div><section className="quote-controls"><label>Product<input readOnly value={productLabel(product)}/></label><div className="field-pair"><label>Quantity<input type="number" min="250" step="250" value={quantity} onChange={e => setQuantity(Math.max(250, Math.min(1000000, Number(e.target.value) || 250)))}/></label><label>Unit price · USD<input type="number" min="0.01" step="0.01" value={unit / 100} onChange={e => setUnit(Math.max(1, Math.round(Number(e.target.value) * 100) || 1))}/></label></div><label className="season-control"><span>Monthly deliveries</span><input type="checkbox" role="switch" checked={recurring} onChange={e => setRecurring(e.target.checked)}/><span className="toggle"/></label>{recurring && <label>Discount · %<input type="number" min="0" max="50" value={discount} onChange={e => setDiscount(Math.max(0, Math.min(50, Number(e.target.value))))}/></label>}<dl className="totals"><div><dt>Products</dt><dd>{money(quote.subtotal)}</dd></div>{recurring && <div><dt>Savings per delivery</dt><dd>−{money(quote.savings)}</dd></div>}<div><dt>Shipping & tax</dt><dd>To be confirmed</dd></div><div className="grand-total"><dt>{recurring ? "Per delivery" : "Estimated total"}</dt><dd>{money(quote.total)}</dd></div></dl><p className="fine-print">Sample prices in USD. {recurring ? "Illustrative discount; no billing is created. " : ""}Final design and production pricing require review.</p><button className="dark-button full" onClick={() => go("email")}>Prepare message <Arrow /></button><button className="quiet-button full" onClick={() => window.print()}>Save proposal as PDF ↓</button></section></div>}
 {step === "email" && <div className="email-layout"><section className="message-form"><label>Recipient<input type="email" placeholder="Enter a business email" value={recipient} onChange={e => { setRecipient(e.target.value); setApproved(false); }}/></label><p className="fine-print contact-note">{recipient ? "Public email found. Confirm it before copying the proposal." : "No public email found. Enter a recipient you have confirmed."}</p><label>Subject<input value={subject} readOnly/></label><label>Message<textarea value={message} onChange={e => { setCustomMessage(e.target.value); setApproved(false); }}/></label><label className="approve-check"><input type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)}/>I reviewed the recipient, design, and price.</label><button className="dark-button" disabled={!approved || !/^\S+@\S+\.\S+$/.test(recipient)} onClick={() => void copy()}>Copy email ↗</button><p className="fine-print">Nothing is sent from this app.</p></section><aside className="email-summary"><CupPreview design={activeDesign} knockout={knockout} product={product} placement={placement} brand={brand} direction={direction}/><h2>{brand.name}</h2><p>{quantity.toLocaleString()} × {productLabel(product)}</p><strong>{money(quote.total)}{recurring ? " / delivery" : ""}</strong><button className="quiet-button full" onClick={() => go("proposal")}>Edit proposal ←</button></aside></div>}{error && <p role="alert" className="error">{error}</p>}{notice && <p className="toast" role="status">{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")}>×</button></p>}
 {enlarged && <div className="modal-backdrop" onClick={() => setEnlarged(false)}><dialog ref={dialogRef} aria-label="Enlarged concept" onCancel={() => setEnlarged(false)} onClick={e => e.stopPropagation()}><button autoFocus className="modal-close" onClick={() => setEnlarged(false)}>Close ×</button><Cup3D design={activeDesign} knockout={knockout} product={product} placement={placement} brand={brand}/></dialog></div>}</main>;
}
