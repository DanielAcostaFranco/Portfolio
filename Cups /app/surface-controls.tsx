"use client";
import { useRef, useState } from 'react';
import type { Material } from './cup-model';
import { surfaceOpacity, opacityAfterColorChange } from './cup-surface';
import type { DesignSpec } from './designs';
import { SEASONS, type Season } from './studio-options';
import { MESSAGE_FONTS, type LogoLayout } from './print-options';
import { readLocalLogo, registerLocalFont, uploadedFontOptions } from './local-brand-assets';
export function SurfaceControls({ design, material, onChange, onSeason, originalColor }: {
    design: DesignSpec;
    material: Material;
    originalColor: string;
    onChange: (values: Partial<DesignSpec>) => void;
    onSeason: (season: Season) => void;
}) {
    const alpha = surfaceOpacity(material, design.backgroundOpacity);
    const fontInput = useRef<HTMLInputElement>(null), backInput = useRef<HTMLInputElement>(null);
    const [fonts, setFonts] = useState(() => [...uploadedFontOptions]), [assetError, setAssetError] = useState(''), [loading, setLoading] = useState('');
    async function uploadFont(file?: File) {
        if (!file)
            return;
        setAssetError('');
        setLoading('font');
        try {
            const font = await registerLocalFont(file);
            setFonts([...uploadedFontOptions]);
            onChange({ messageFont: font.value });
        }
        catch {
            setAssetError('Could not load that font. Use a valid WOFF, WOFF2, TTF or OTF under 5 MB.');
        }
        finally {
            setLoading('');
            if (fontInput.current)
                fontInput.current.value = '';
        }
    }
    async function uploadBack(file?: File) {
        if (!file)
            return;
        setAssetError('');
        setLoading('back');
        try {
            onChange({ backLogo: await readLocalLogo(file) });
        }
        catch (e) {
            setAssetError(e instanceof Error ? e.message : 'Could not open this logo.');
        }
        finally {
            setLoading('');
            if (backInput.current)
                backInput.current.value = '';
        }
    }
    return <section className="surface-controls" aria-label="Cup colors and message">
        <div className="rail-title">Make it yours</div>
        {material === 'paper' && <div className="lid-option"><span>Paper cup lid</span><div className="option-segments"><button aria-pressed={!design.lid} onClick={() => onChange({ lid: false })}>No lid</button><button aria-pressed={Boolean(design.lid)} onClick={() => onChange({ lid: true })}>Add lid</button></div></div>}
        <div className="surface-colors">{[{ label: 'Cup color', key: 'background', value: design.background ?? '#ffffff' }, { label: 'Print color', key: 'color', value: design.color }, { label: 'Accent color', key: 'accent', value: design.accent }].map(item => <label key={item.key}><input type="color" aria-label={item.label} value={item.value} onInput={e => onChange(item.key === 'background' ? { background: e.currentTarget.value, ...(material === 'clear' ? { backgroundOpacity: opacityAfterColorChange(material, design.backgroundOpacity) } : {}) } : { [item.key]: e.currentTarget.value })}/><span>{item.label}</span><small>{item.value.toUpperCase()}</small></label>)}</div>
        {material === 'clear' && <div className="cup-alpha"><div className="alpha-heading"><span className="alpha-chip"><i style={{ backgroundColor: design.background ?? '#ffffff', opacity: alpha }}/></span><label htmlFor="cup-opacity">Cup opacity</label><output htmlFor="cup-opacity">{Math.round(alpha * 100)}%</output></div><input id="cup-opacity" aria-label="Cup opacity" type="range" min="0" max="100" step="1" value={Math.round(alpha * 100)} onChange={e => onChange({ backgroundOpacity: Number(e.target.value) / 100 })}/><div className="alpha-presets"><button aria-pressed={alpha === 0} onClick={() => onChange({ backgroundOpacity: 0 })}>Transparent</button><button aria-pressed={alpha === .5} onClick={() => onChange({ backgroundOpacity: .5 })}>Tinted</button><button aria-pressed={alpha === 1} onClick={() => onChange({ backgroundOpacity: 1 })}>Solid</button></div></div>}
        <div className="print-options"><label className="control-label">Logo layout<select aria-label="Logo layout" value={design.logoLayout ?? 'front'} onChange={e => onChange({ logoLayout: e.target.value as LogoLayout })}><option value="front">Front only</option><option value="both">Front + back</option><option value="repeat">All-over logos</option></select></label>
            {design.logoLayout === 'both' && <div className="back-logo-control">{design.backLogo && <img src={design.backLogo} alt="Back logo"/>}<div><span>{design.backLogo ? 'Custom back logo' : 'Same logo on both sides'}</span><button className="text-control" disabled={loading === 'back'} onClick={() => backInput.current?.click()}>{loading === 'back' ? 'Opening…' : 'Upload back logo'}</button>{design.backLogo && <button className="text-control" onClick={() => onChange({ backLogo: undefined })}>Use front logo</button>}</div></div>}
            <div className="logo-ink-control"><label>Logo color<input aria-label="Logo color" type="color" value={design.logoColor ?? originalColor} onInput={e => onChange({ logoColor: e.currentTarget.value })}/></label><button aria-pressed={!design.logoColor} className="text-control" onClick={() => onChange({ logoColor: undefined })}>Original colors</button></div>
            <p className="control-note">{design.logoColor ? 'Single-color print · original alpha preserved.' : 'Original image colors · no automatic recoloring.'}</p>
        </div>
        <label className="message-label">Message<input type="text" placeholder="Make every sip count." maxLength={70} value={design.message ?? ''} onChange={e => onChange({ message: e.target.value })}/></label>
        {design.message && <div className="message-type"><label className="control-label">Message font<select aria-label="Message font" value={design.messageFont ?? 'Arial'} onChange={e => onChange({ messageFont: e.target.value })}>{[...MESSAGE_FONTS, ...fonts].map(font => <option value={font.value} key={font.value}>{font.label}</option>)}</select></label><button className="text-control" disabled={loading === 'font'} onClick={() => fontInput.current?.click()}>{loading === 'font' ? 'Loading font…' : 'Upload font ↗'}</button><span className="control-note">WOFF / WOFF2 / TTF / OTF · this session</span><label className="message-ink">Message color<input aria-label="Message color" type="color" value={design.messageColor ?? design.color} onInput={e => onChange({ messageColor: e.currentTarget.value })}/></label></div>}
        <label className="collection-label">Collection<select aria-label="Seasonal collection" value={SEASONS.includes(design.pattern as Season) ? design.pattern : 'none'} onChange={e => onSeason(e.target.value as Season)}><option value="none">Everyday</option><option value="holiday">Holiday · Pines & candy ribbons</option><option value="summer">Summer · Citrus grove</option><option value="valentine">Valentine · Love notes</option><option value="halloween">Halloween · After dark</option></select></label>
        <input ref={fontInput} className="visually-hidden" type="file" accept=".woff,.woff2,.ttf,.otf" aria-label="Choose message font" onChange={e => void uploadFont(e.target.files?.[0])}/>
        <input ref={backInput} className="visually-hidden" type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" aria-label="Choose back logo" onChange={e => void uploadBack(e.target.files?.[0])}/>
        {assetError && <p className="error" role="alert">{assetError}</p>}
    </section>;
}
