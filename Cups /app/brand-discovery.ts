export type LogoCandidate = {
    src: string;
    label: string;
    kind: 'brand' | 'social' | 'icon';
};

function absoluteUrl(value: string, pageUrl: URL) {
    try {
        const url = new URL(value, pageUrl);
        return /^https?:$/.test(url.protocol) ? url.toString() : null;
    }
    catch {
        return null;
    }
}

function cleanText(value: string) {
    return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function discoverLogoCandidates(html: string, pageUrl: string): { name: string; candidates: Array<Omit<LogoCandidate, 'src'> & { url: string }> } {
    const url = new URL(pageUrl);
    const found: Array<Omit<LogoCandidate, 'src'> & { url: string }> = [];
    const add = (value: string | undefined, label: LogoCandidate['label'], kind: LogoCandidate['kind']) => {
        const resolved = value && absoluteUrl(value.trim(), url);
        if (resolved && !found.some(candidate => candidate.url === resolved))
            found.push({ url: resolved, label, kind });
    };

    for (const block of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
        try {
            const json = JSON.parse(block[1]);
            const values = Array.isArray(json) ? json : [json];
            for (const item of values) {
                const logo = item?.logo;
                if (typeof logo === 'string') add(logo, 'Brand logo', 'brand');
                else if (logo?.url) add(logo.url, 'Brand logo', 'brand');
                if (item?.image) add(typeof item.image === 'string' ? item.image : item.image.url, 'Brand image', 'brand');
            }
        }
        catch { /* Invalid JSON-LD is common and not fatal. */ }
    }
    for (const match of html.matchAll(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["'][^>]*>/gi))
        add(match[1], 'Social preview', 'social');
    for (const match of html.matchAll(/<link[^>]+(?:rel=["'][^"']*(?:icon|apple-touch-icon)[^"']*["'][^>]+href=["']([^"']+)["']|href=["']([^"']+)["'][^>]+rel=["'][^"']*(?:icon|apple-touch-icon)[^"']*["'])[^>]*>/gi))
        add(match[1] ?? match[2], 'Site icon', 'icon');
    for (const match of html.matchAll(/<img[^>]+(?:class|id|alt)=["'][^"']*(?:logo|brand|wordmark)[^"']*["'][^>]+(?:src|data-src)=["']([^"']+)["'][^>]*>|<img[^>]+(?:src|data-src)=["']([^"']+)["'][^>]+(?:class|id|alt)=["'][^"']*(?:logo|brand|wordmark)[^"']*["'][^>]*>/gi))
        add(match[1] ?? match[2], 'Logo image', 'brand');
    add('/favicon.ico', 'Site icon', 'icon');

    const title = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1]
        ?? cleanText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '')
        ?? url.hostname.replace(/^www\./, '');
    const rank = (candidate: typeof found[number]) => candidate.label === 'Brand logo' ? 0 : candidate.kind === 'social' ? 1 : candidate.label === 'Logo image' ? 2 : 3;
    return { name: title || url.hostname, candidates: found.sort((a, b) => rank(a) - rank(b)).slice(0, 6) };
}
