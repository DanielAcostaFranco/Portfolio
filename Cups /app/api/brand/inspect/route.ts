import { NextRequest, NextResponse } from 'next/server';
import { discoverLogoCandidates } from '../../../brand-discovery';

const MAX_HTML = 2_000_000;
const MAX_IMAGE = 5_000_000;
const imageTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']);

function validTarget(value: unknown) {
    if (typeof value !== 'string' || value.length > 2048)
        return null;
    try {
        const url = new URL(value.includes('://') ? value : `https://${value}`);
        if (!/^https?:$/.test(url.protocol) || url.username || url.password || !url.hostname.includes('.') || ['localhost', '127.0.0.1', '::1'].includes(url.hostname))
            return null;
        return url;
    }
    catch { return null; }
}

async function readLimited(response: Response, limit: number) {
    const reader = response.body?.getReader();
    if (!reader) return new Uint8Array();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
        const next = await reader.read();
        if (next.done) break;
        total += next.value.byteLength;
        if (total > limit) throw Error('Response too large');
        chunks.push(next.value);
    }
    const output = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) { output.set(chunk, offset); offset += chunk.byteLength; }
    return output;
}

async function fetchWithTimeout(input: string, headers: HeadersInit) {
    return fetch(input, { headers, redirect: 'follow', signal: AbortSignal.timeout(7000), cache: 'no-store' });
}

function domainFromTarget(target: URL) { return target.hostname.replace(/^www\./, ''); }

function brandSearchTerms(name: string, target: URL) {
    const domainName = target.hostname.replace(/^www\./, '').split('.')[0].replace(/[-_]+/g, ' ').trim();
    const raw = name.replace(/\.(com|net|org|co|us)$/i, '').trim();
    const terms = [raw, domainName, domainName.replace(/([a-z])([A-Z])/g, '$1 $2')];
    for (const value of [...terms]) {
        const compact = value.replace(/[\s'’]/g, '');
        if (compact.length > 3 && compact.endsWith('s')) terms.push(`${compact.slice(0, -1)}'s`);
    }
    return [...new Set(terms.map(term => term.trim()).filter(Boolean))];
}

async function wikidataLogo(entityId: unknown) {
    if (typeof entityId !== 'string' || !/^Q\d+$/i.test(entityId)) return null;
    try {
        const response = await fetchWithTimeout(`https://www.wikidata.org/wiki/Special:EntityData/${entityId.toUpperCase()}.json`, { 'user-agent': 'CustomCupStudio/1.0 logo discovery', accept: 'application/json' });
        if (!response.ok) return null;
        const data = await response.json();
        const claims = data.entities?.[entityId.toUpperCase()]?.claims?.P154 ?? [];
        const file = claims.find((claim: any) => typeof claim?.mainsnak?.datavalue?.value === 'string')?.mainsnak?.datavalue?.value;
        return typeof file === 'string' && file ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=900` : null;
    }
    catch { return null; }
}

async function wikidataLogoForWebsite(name: string, target: URL) {
    const searchTerms = brandSearchTerms(name, target);
    if (!searchTerms.length) return null;
    try {
        const results: any[] = [];
        for (const term of searchTerms) {
            const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(term)}&language=en&format=json&limit=5&origin=*`;
            const search = await fetchWithTimeout(searchUrl, { 'user-agent': 'CustomCupStudio/1.0 logo discovery', accept: 'application/json' }).then(response => response.ok ? response.json() : null);
            results.push(...(Array.isArray(search?.search) ? search.search : []));
        }
        for (const result of results) {
            const entityId = result?.id;
            if (typeof entityId !== 'string') continue;
            const entityResponse = await fetchWithTimeout(`https://www.wikidata.org/wiki/Special:EntityData/${entityId}.json`, { 'user-agent': 'CustomCupStudio/1.0 logo discovery', accept: 'application/json' });
            if (!entityResponse.ok) continue;
            const entityData = await entityResponse.json();
            const entity = entityData.entities?.[entityId];
            const websites = entity?.claims?.P856 ?? [];
            const matchesWebsite = websites.some((claim: any) => {
                const value = claim?.mainsnak?.datavalue?.value;
                try { return typeof value === 'string' && new URL(value).hostname.replace(/^www\./, '') === target.hostname.replace(/^www\./, ''); }
                catch { return false; }
            });
            if (!matchesWebsite) continue;
            const logo = await wikidataLogo(entityId);
            if (logo) return logo;
        }
    }
    catch { /* Wikidata is an enhancement, not a reason to fail website discovery. */ }
    return null;
}

async function commonsLogoCandidates(name: string, target: URL) {
    const candidates: any[] = [];
    for (const term of brandSearchTerms(name, target).slice(0, 4)) {
        try {
            const params = new URLSearchParams({ action: 'query', generator: 'search', gsrsearch: `${term} logo`, gsrnamespace: '6', gsrlimit: '8', prop: 'imageinfo', iiprop: 'url|mime', iiurlwidth: '900', format: 'json', origin: '*' });
            const response = await fetchWithTimeout(`https://commons.wikimedia.org/w/api.php?${params}`, { 'user-agent': 'CustomCupStudio/1.0 logo discovery', accept: 'application/json' });
            if (!response.ok) continue;
            const data = await response.json();
            for (const page of Object.values(data?.query?.pages ?? {}) as any[]) {
                const info = page?.imageinfo?.[0];
                const url = info?.thumburl || info?.url;
                if (typeof url === 'string' && /^https?:\/\//i.test(url) && (!info?.mime || /^image\//.test(info.mime)) && !candidates.some(candidate => candidate.url === url))
                    candidates.push({ url, label: 'Commons logo result', kind: 'brand', source: 'Wikimedia Commons' });
            }
        }
        catch { /* Commons is an optional fallback. */ }
        if (candidates.length >= 4) break;
    }
    return candidates;
}

function providerCandidates(target: URL) {
    const domain = domainFromTarget(target);
    const found: any[] = [];
    const logoToken = process.env.LOGO_DEV_TOKEN;
    if (logoToken) found.push({ url: `https://img.logo.dev/${domain}?token=${encodeURIComponent(logoToken)}&size=512&format=png`, label: 'Logo provider', kind: 'brand', source: 'Logo.dev' });
    const brandfetchId = process.env.BRANDFETCH_CLIENT_ID;
    if (brandfetchId) found.push({ url: `https://cdn.brandfetch.io/domain/${domain}?c=${encodeURIComponent(brandfetchId)}&type=logo`, label: 'Logo provider', kind: 'brand', source: 'Brandfetch' });
    return found;
}

async function manifestCandidates(html: string, target: URL) {
    const match = html.match(/<link[^>]+rel=["'][^"']*manifest[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>/i) ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*manifest[^"']*["'][^>]*>/i);
    if (!match) return [];
    try {
        const manifestUrl = new URL(match[1], target).toString();
        const response = await fetchWithTimeout(manifestUrl, { 'user-agent': 'CustomCupStudio/1.0 logo discovery', accept: 'application/manifest+json,application/json' });
        if (!response.ok) return [];
        const manifest = await response.json();
        return (Array.isArray(manifest.icons) ? manifest.icons : []).map((icon: any) => icon?.src).filter((src: unknown): src is string => typeof src === 'string').map((src: string) => ({ url: new URL(src, manifestUrl).toString(), label: 'App icon', kind: 'icon' as const, source: 'Web manifest' }));
    }
    catch { return []; }
}

async function googleImageCandidates(name: unknown, target: URL) {
    const key = process.env.GOOGLE_CUSTOM_SEARCH_KEY ?? process.env.GOOGLE_API_KEY ?? process.env.GOOGLE_PLACES_API_KEY;
    const cx = process.env.GOOGLE_CUSTOM_SEARCH_CX ?? process.env.GOOGLE_CX ?? process.env.GOOGLE_SEARCH_ENGINE_ID;
    if (!key || !cx) return [];
    const query = `${typeof name === 'string' && name.trim() ? name.trim() : domainFromTarget(target)} logo`;
    try {
        const params = new URLSearchParams({ key, cx, q: query, searchType: 'image', num: '8', safe: 'active', imgSize: 'medium' });
        const data = await fetchWithTimeout(`https://www.googleapis.com/customsearch/v1?${params}`, { 'user-agent': 'CustomCupStudio/1.0 logo discovery', accept: 'application/json' }).then(response => response.ok ? response.json() : null);
        return (Array.isArray(data?.items) ? data.items : []).flatMap((item: any) => {
            const imageUrl = typeof item?.link === 'string' ? item.link : '';
            if (!/^https?:\/\//i.test(imageUrl)) return [];
            return [{ url: imageUrl, label: 'Google image result', kind: 'brand' as const, source: 'Google Images' }];
        });
    }
    catch { return []; }
}

async function searxngImageCandidates(name: unknown, target: URL) {
    const configured = process.env.SEARXNG_URL?.trim().replace(/\/$/, '');
    const instances = configured ? [configured] : ['https://searx.be'];
    const query = `${typeof name === 'string' && name.trim() ? name.trim() : domainFromTarget(target)} logo`;
    for (const instance of instances) {
        try {
            const params = new URLSearchParams({ q: query, categories: 'images', format: 'json', safesearch: '1' });
            const response = await fetchWithTimeout(`${instance}/search?${params}`, { 'user-agent': 'CustomCupStudio/1.0 logo discovery', accept: 'application/json' });
            if (!response.ok) continue;
            const data = await response.json();
            const candidates = (Array.isArray(data?.results) ? data.results : []).flatMap((item: any) => {
                const imageUrl = typeof item?.img_src === 'string' ? item.img_src : typeof item?.thumbnail_src === 'string' ? item.thumbnail_src : '';
                if (!/^https?:\/\//i.test(imageUrl)) return [];
                return [{ url: imageUrl, label: 'SearXNG image result', kind: 'brand' as const, source: 'SearXNG' }];
            });
            if (candidates.length) return candidates;
        }
        catch { /* A public instance can be unavailable or have JSON disabled. */ }
    }
    return [];
}

export async function POST(request: NextRequest) {
    const payload = await request.json().catch(() => ({}));
    const target = validTarget(payload.url);
    if (!target) return NextResponse.json({ error: 'Enter a public website URL.' }, { status: 400 });
    try {
        let html = '';
        try {
            const page = await fetchWithTimeout(target.toString(), { 'user-agent': 'CustomCupStudio/1.0 brand discovery', accept: 'text/html,application/xhtml+xml' });
            if (page.ok) html = new TextDecoder().decode(await readLimited(page, MAX_HTML));
        }
        catch { /* Provider and domain fallbacks can still work when the site blocks us. */ }
        const discovery = html ? discoverLogoCandidates(html, target.toString()) : { name: String(payload.name || domainFromTarget(target)), candidates: [] };
        const rawCandidates: any[] = [...discovery.candidates, ...(html ? await manifestCandidates(html, target) : [])];
        const wikidataCandidate = await wikidataLogo(payload.wikidata) ?? await wikidataLogoForWebsite(discovery.name, target);
        if (wikidataCandidate) rawCandidates.push({ url: wikidataCandidate, label: 'Wikidata logo', kind: 'brand', source: 'Wikidata' });
        rawCandidates.push(...await commonsLogoCandidates(payload.name || discovery.name, target));
        rawCandidates.push(...providerCandidates(target));
        rawCandidates.push(...await googleImageCandidates(payload.name || discovery.name, target));
        rawCandidates.push(...await searxngImageCandidates(payload.name || discovery.name, target));
        const candidates = [];
        for (const candidate of rawCandidates.slice(0, 14)) {
            try {
                const image = await fetchWithTimeout(candidate.url, { 'user-agent': 'CustomCupStudio/1.0 logo discovery', accept: 'image/*' });
                const type = (image.headers.get('content-type') ?? '').split(';')[0].toLowerCase();
                const bytes = await readLimited(image, MAX_IMAGE);
                if (!image.ok || !imageTypes.has(type) || !bytes.length) continue;
                candidates.push({ label: candidate.label, kind: candidate.kind, source: candidate.source ?? 'Official website', src: `data:${type};base64,${Buffer.from(bytes).toString('base64')}` });
            }
            catch { /* A broken icon should not prevent other candidates from loading. */ }
        }
        return NextResponse.json({ name: discovery.name, candidates, sources: [...new Set(candidates.map(candidate => candidate.source))] });
    }
    catch {
        return NextResponse.json({ error: 'We could not read that website. You can upload the logo instead.' }, { status: 502 });
    }
}
