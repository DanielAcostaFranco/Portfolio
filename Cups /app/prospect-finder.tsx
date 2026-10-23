"use client";
import { useEffect, useRef, useState } from 'react';
import { categoryLabel, type Prospect } from './prospecting';
import { catalogDesign } from './designs';
import { CupPreview, type CupBrand } from './cup-preview';

type Concept = { prospect: Prospect; logo: string; logoLabel: string; email: string; emailLabel: string };
const categoryColors: Record<Prospect['category'], [string, string]> = {
    coffee: ['#8b4c2f', '#f2dfc3'], bakery: ['#9a5b36', '#f3dfd0'], 'ice-cream': ['#d45c83', '#f5d8df'], juice: ['#2d8c6b', '#f2c94c'], restaurant: ['#bd3025', '#f3d4b5'], other: ['#51465d', '#eee4ef'],
};

export function ProspectFinder({ onOpen }: { onOpen: (prospect: Prospect, logo?: string, recipient?: string) => void }) {
    const [city, setCity] = useState(''), [suggestions, setSuggestions] = useState<Array<{ label: string; value: string; type: string }>>([]), [showSuggestions, setShowSuggestions] = useState(false), [prospects, setProspects] = useState<Prospect[]>([]), [selected, setSelected] = useState<string[]>([]), [concepts, setConcepts] = useState<Concept[]>([]), [outreachSelected, setOutreachSelected] = useState<string[]>([]), [busy, setBusy] = useState(false), [preparing, setPreparing] = useState(false), [error, setError] = useState('');
    const suggestionRequest = useRef<AbortController | null>(null);
    useEffect(() => {
        const query = city.trim();
        if (query.length < 2) { setSuggestions([]); return; }
        const timer = window.setTimeout(async () => {
            suggestionRequest.current?.abort();
            const controller = new AbortController(); suggestionRequest.current = controller;
            try { const response = await fetch(`/api/prospects/suggest?q=${encodeURIComponent(query)}`, { signal: controller.signal }); const data = await response.json(); if (!controller.signal.aborted) { setSuggestions(data.suggestions ?? []); setShowSuggestions(true); } }
            catch { /* Suggestions are optional; the full search remains available. */ }
        }, 260);
        return () => window.clearTimeout(timer);
    }, [city]);
    async function search(event: React.FormEvent) {
        event.preventDefault(); setBusy(true); setError(''); setSelected([]); setConcepts([]); setOutreachSelected([]); setShowSuggestions(false);
        try { const response = await fetch('/api/prospects/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ city }) }); const data = await response.json(); if (!response.ok) throw Error(data.error); setProspects(data.prospects); }
        catch (e) { setError(e instanceof Error ? e.message : 'Could not search businesses.'); } finally { setBusy(false); }
    }
    const chosen = prospects.filter(p => selected.includes(p.id));
    async function prepareConcepts() {
        setBusy(true); setPreparing(true); setError(''); setConcepts([]); setOutreachSelected([]);
        try {
            for (const prospect of chosen) {
                let concept: Concept;
                const inspectUrl = prospect.website || (prospect.wikidata ? `https://www.wikidata.org/wiki/${prospect.wikidata}` : '');
                let email = '', emailLabel = 'No public email found';
                if (prospect.website) {
                    try { const contactResponse = await fetch('/api/prospects/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: prospect.website }) }); const contact = await contactResponse.json(); email = contact.emails?.[0] ?? ''; emailLabel = email ? 'Public email found' : 'No public email found'; } catch { emailLabel = 'Email unavailable'; }
                }
                if (!inspectUrl) concept = { prospect, logo: '', logoLabel: 'No public website found', email, emailLabel };
                else {
                    try { const response = await fetch('/api/brand/inspect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: inspectUrl, name: prospect.name, wikidata: prospect.wikidata }) }); const data = await response.json(); const candidate = data.candidates?.[0]; concept = { prospect, logo: candidate?.src ?? '', logoLabel: candidate ? `${candidate.label} · ${candidate.source ?? 'website'}` : 'No public logo found', email, emailLabel }; }
                    catch { concept = { prospect, logo: '', logoLabel: 'Logo unavailable', email, emailLabel }; }
                }
                setConcepts(current => [...current, concept]);
                if (concept.email) setOutreachSelected(current => [...current, concept.prospect.id]);
            }
        }
        catch { setError('Some selected businesses could not be prepared.'); }
        finally { setBusy(false); setPreparing(false); }
    }
    return <section className="prospect-finder" aria-label="Send cup proposals to local businesses">
        <div className="prospect-heading"><div><h2>Send cup proposals to local businesses</h2><p>Choose a city, select food and drink businesses, then prepare personalized outreach with public contact emails.</p></div><span>OpenStreetMap data</span></div>
        <form className="prospect-search" onSubmit={search}><div className="city-input-wrap"><input aria-label="City or area" placeholder="City or area · e.g. Austin, TX" value={city} onFocus={() => suggestions.length > 0 && setShowSuggestions(true)} onChange={e => { setCity(e.target.value); setShowSuggestions(true); }} onBlur={() => window.setTimeout(() => setShowSuggestions(false), 150)} autoComplete="off" required/>{showSuggestions && suggestions.length > 0 && <div className="city-suggestions" role="listbox" aria-label="City suggestions">{suggestions.map(suggestion => <button type="button" role="option" key={`${suggestion.value}-${suggestion.type}`} onMouseDown={event => event.preventDefault()} onClick={() => { setCity(suggestion.value); setShowSuggestions(false); setSuggestions([]); }}>{suggestion.value}<small>{suggestion.type}</small></button>)}</div>}</div><button className="dark-button" disabled={busy}>{busy ? 'Searching…' : 'Search'}</button></form>
        {error && <p className="error" role="alert">{error}</p>}
        {prospects.length > 0 && <><div className="prospect-toolbar"><span>{prospects.length} prospects found</span>{chosen.length > 0 && <span>{chosen.length} selected</span>}</div><div className="prospect-grid">{prospects.map(prospect => <article className={'prospect-card ' + (selected.includes(prospect.id) ? 'selected' : '')} key={prospect.id}><label><input type="checkbox" checked={selected.includes(prospect.id)} onChange={e => { setSelected(current => e.target.checked ? [...current, prospect.id] : current.filter(id => id !== prospect.id)); setConcepts([]); }}/><span>{prospect.name}</span></label><small>{categoryLabel(prospect.category)} · {prospect.address}</small><p>{prospect.recommendation.reason}</p>{prospect.website && <button className="text-control" type="button" onClick={() => onOpen(prospect)}>Open brand in Studio →</button>}</article>)}</div>{chosen.length > 0 && <div className="draft-panel"><strong>Build outreach proposals</strong><p>We’ll prepare a cup concept, find a public logo, and check the business website for a public contact email.</p><button className="dark-button" type="button" disabled={busy} onClick={() => void prepareConcepts()}>{busy ? 'Preparing outreach…' : 'Prepare selected proposals'}</button></div>}</>}
        {(concepts.length > 0 || preparing) && <section className="prospect-concepts" aria-label="Selected cup concepts"><div className="prospect-toolbar"><strong>{concepts.length} of {chosen.length} cup concepts ready</strong><span>{preparing ? 'Building the next preview…' : `${outreachSelected.length} selected for outreach`}</span></div><div className="prospect-concept-grid">{concepts.map((concept, index) => { const colors = categoryColors[concept.prospect.category]; const brand: CupBrand = { name: concept.prospect.name, mark: concept.prospect.name.slice(0, 14), color: colors[0], accent: colors[1], logo: concept.logo, demo: false }; const included = outreachSelected.includes(concept.prospect.id); return <article className={'prospect-concept ' + (included ? 'outreach-included' : '')} key={concept.prospect.id}><CupPreview brand={brand} product={concept.prospect.recommendation} design={catalogDesign(index % 3, colors[0], colors[1])} placement={{ scale: 90, horizontal: 0, vertical: 0 }} knockout/><div><label className="outreach-toggle"><input type="checkbox" checked={included} disabled={!concept.email} onChange={event => setOutreachSelected(current => event.target.checked ? [...current, concept.prospect.id] : current.filter(id => id !== concept.prospect.id))}/><span>Include in outreach</span></label><strong>{concept.prospect.name}</strong><small>{categoryLabel(concept.prospect.category)} · {concept.logoLabel}</small><small className={concept.email ? 'email-found' : 'email-missing'}>{concept.email ? `${concept.email} · ${concept.emailLabel}` : concept.emailLabel}</small><button className="text-control" type="button" onClick={() => onOpen(concept.prospect, concept.logo, concept.email)}>{concept.email ? 'Prepare email proposal →' : 'Customize this cup →'}</button></div></article>; })}{preparing && <article className="prospect-concept concept-loading" aria-live="polite"><div className="concept-spinner"/><strong>Preparing next cup</strong><small>Finding the logo, public email and building the mockup…</small></article>}</div>{!preparing && concepts.length > 0 && <div className="outreach-summary"><strong>{outreachSelected.length} proposal{outreachSelected.length === 1 ? '' : 's'} ready for outreach</strong><span>Open a proposal to review the cup and copy the message with its public email prefilled.</span></div>}</section>}
        <small className="osm-credit">Business data © OpenStreetMap contributors · public prototype data</small>
    </section>;
}
