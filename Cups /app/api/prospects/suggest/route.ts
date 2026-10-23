import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get('q')?.trim().slice(0, 100) ?? '';
    if (query.length < 2) return NextResponse.json({ suggestions: [] });
    try {
        let places: any[] = [];
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`, { headers: { 'user-agent': 'CustomCupStudio/1.0 (prototype)', accept: 'application/json' }, signal: AbortSignal.timeout(7000), cache: 'no-store' });
            if (response.ok) places = await response.json();
        }
        catch { /* Photon is the fallback geocoder. */ }
        if (!places.length) {
            const fallback = await fetch(`https://photon.komoot.io/api/?limit=5&q=${encodeURIComponent(query)}`, { headers: { 'user-agent': 'CustomCupStudio/1.0 (prototype)', accept: 'application/json' }, signal: AbortSignal.timeout(7000), cache: 'no-store' });
            if (fallback.ok) {
                const data = await fallback.json();
                places = (data.features ?? []).map((feature: any) => ({ display_name: [feature.properties?.name, feature.properties?.city, feature.properties?.state, feature.properties?.country].filter(Boolean).join(', '), type: feature.properties?.type ?? 'area' }));
            }
        }
        const suggestions = (Array.isArray(places) ? places : []).map((place: any) => ({
            label: String(place.display_name ?? '').split(',').slice(0, 3).join(',').trim(),
            value: String(place.display_name ?? '').split(',').slice(0, 2).join(',').trim(),
            type: String(place.type ?? 'area'),
        })).filter((place: { label: string; value: string }) => place.label && place.value);
        return NextResponse.json({ suggestions });
    }
    catch { return NextResponse.json({ suggestions: [] }); }
}
