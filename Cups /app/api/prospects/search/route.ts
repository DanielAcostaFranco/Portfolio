import { NextRequest, NextResponse } from 'next/server';
import { buildOverpassQuery, osmElementsToProspects } from '../../../osm-prospects';
import { classifyBusiness, cupRecommendation } from '../../../prospecting';

const headers = { 'user-agent': 'CustomCupStudio/1.0 (prototype)', accept: 'application/json' };
const searchCache = new Map<string, { expires: number; value: unknown }>();

async function getJson(url: string, timeout: number) {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(timeout), cache: 'no-store' });
    if (!response.ok) throw Error(`Request failed: ${response.status}`);
    return response.json();
}

async function geocodeCity(city: string) {
    const encoded = encodeURIComponent(city);
    try {
        const places = await getJson(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encoded}`, 10000);
        const place = places?.[0];
        if (place?.lat && place?.lon && place?.boundingbox) return { lat: Number(place.lat), lon: Number(place.lon), box: place.boundingbox };
    }
    catch { /* Try the open Photon geocoder below. */ }
    const photon = await getJson(`https://photon.komoot.io/api/?limit=1&q=${encoded}`, 10000);
    const feature = photon?.features?.[0];
    const [lon, lat] = feature?.geometry?.coordinates ?? [];
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { lat, lon, box: [lat - .09, lat + .09, lon - .09, lon + .09] };
}

async function queryOverpass(query: string) {
    const endpoints = [
        'https://overpass-api.de/api/interpreter',
        'https://overpass.kumi.systems/api/interpreter',
        'https://overpass.private.coffee/api/interpreter',
    ];
    let lastError: unknown;
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint, { method: 'POST', headers: { ...headers, 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ data: query }), signal: AbortSignal.timeout(30000), cache: 'no-store' });
            if (!response.ok) throw Error(`Overpass request failed: ${response.status}`);
            return response.json();
        }
        catch (error) { lastError = error; }
    }
    throw lastError ?? Error('All Overpass endpoints failed');
}

async function photonBusinessFallback(city: string) {
    const categories = ['restaurant', 'cafe', 'bakery', 'ice cream'];
    const results: any[] = [];
    for (const category of categories) {
        try {
            const data = await getJson(`https://photon.komoot.io/api/?limit=8&q=${encodeURIComponent(`${category}, ${city}`)}`, 8000);
            results.push(...(Array.isArray(data?.features) ? data.features : []));
        }
        catch { /* Continue with the next category. */ }
    }
    const seen = new Set<string>();
    return results.flatMap((feature, index) => {
        const properties = feature?.properties ?? {}, name = String(properties.name ?? '').trim();
        if (!name) return [];
        const [lon, lat] = feature?.geometry?.coordinates ?? [];
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return [];
        const address = [properties.housenumber, properties.street, properties.city ?? city].filter(Boolean).join(' ') || city;
        const key = `${name.toLowerCase()}|${address.toLowerCase()}`;
        if (seen.has(key)) return [];
        seen.add(key);
        const category = classifyBusiness(name, [properties.type, properties.osm_value, properties.osm_key].filter(Boolean));
        return [{ id: `photon-${properties.osm_id ?? index}`, name, address, website: String(properties.website ?? ''), phone: String(properties.phone ?? ''), category, types: [String(properties.type ?? 'food')], recommendation: cupRecommendation(category) }];
    }).sort((a, b) => a.name.localeCompare(b.name)).slice(0, 40);
}

function cityBox(location: { lat: number; lon: number; box: any[] }) {
    if (!Number.isFinite(location.lat) || !Number.isFinite(location.lon)) return null;
    const values = location.box.map(Number);
    if (values.length < 4 || values.some(value => !Number.isFinite(value))) return null;
        const span = .14;
    return { south: Math.max(values[0], location.lat - span), north: Math.min(values[1], location.lat + span), west: Math.max(values[2], location.lon - span), east: Math.min(values[3], location.lon + span) };
}

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => ({}));
    const city = typeof body.city === 'string' ? body.city.trim().slice(0, 120) : '';
    if (!city) return NextResponse.json({ error: 'Enter a city or area.' }, { status: 400 });
    const cacheKey = city.toLowerCase();
    const cached = searchCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) return NextResponse.json(cached.value);
    try {
        const location = await geocodeCity(city);
        const box = location?.box;
        if (!box) return NextResponse.json({ error: 'We could not locate that city. Try a city and state/country.' }, { status: 404 });
        const centerLat = location.lat, centerLon = location.lon;
        // Keep prototype queries small and responsive instead of asking Overpass for an entire metro boundary.
        const bbox = cityBox({ lat: centerLat, lon: centerLon, box });
        if (!bbox) return NextResponse.json({ error: 'We could not determine the boundaries for that city. Try including state or country.' }, { status: 422 });
        try {
            const data = await queryOverpass(buildOverpassQuery(bbox));
            const prospects = osmElementsToProspects(Array.isArray(data?.elements) ? data.elements : [], city).slice(0, 80);
            const value = { city, prospects, source: 'OpenStreetMap' };
            searchCache.set(cacheKey, { expires: Date.now() + 10 * 60 * 1000, value });
            return NextResponse.json(value);
        }
        catch {
            const prospects = await photonBusinessFallback(city);
            if (prospects.length) {
                const value = { city, prospects, source: 'Photon / OpenStreetMap' };
                searchCache.set(cacheKey, { expires: Date.now() + 5 * 60 * 1000, value });
                return NextResponse.json(value);
            }
            throw Error('No business provider returned results');
        }
    }
    catch { return NextResponse.json({ error: 'We could not reach the business data providers. Check your connection and try a city with state or country.' }, { status: 502 }); }
}
