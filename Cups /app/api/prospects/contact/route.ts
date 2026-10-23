import { NextRequest, NextResponse } from 'next/server';

const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const ignoredMailbox = /^(noreply|no-reply|donotreply|do-not-reply|mailer-daemon|privacy|abuse)@/i;

function validTarget(value: unknown) {
    if (typeof value !== 'string' || value.length > 2048) return null;
    try {
        const url = new URL(value.includes('://') ? value : `https://${value}`);
        return /^https?:$/.test(url.protocol) && !url.username && !url.password && url.hostname.includes('.') ? url : null;
    }
    catch { return null; }
}

function extractEmails(html: string) {
    const values = new Set<string>();
    for (const match of html.matchAll(/mailto:([^?"'\s>]+)/gi)) values.add(match[1]);
    for (const match of html.matchAll(emailPattern)) values.add(match[0]);
    return [...values].map(email => email.replace(/^mailto:/i, '').replace(/[),.;:]+$/, '').toLowerCase()).filter(email => !ignoredMailbox.test(email));
}

function contactLinks(html: string, origin: URL) {
    const links: string[] = [];
    for (const match of html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
        const text = `${match[1]} ${match[2]}`.replace(/<[^>]+>/g, ' ').toLowerCase();
        if (!/contact|about|hello|team|catering|franchise/.test(text)) continue;
        try { const url = new URL(match[1], origin); if (url.origin === origin.origin && /^https?:$/.test(url.protocol)) links.push(url.toString()); } catch { /* Ignore malformed links. */ }
    }
    return [...new Set(links)].slice(0, 3);
}

async function fetchPage(url: string) {
    const response = await fetch(url, { headers: { 'user-agent': 'CustomCupStudio/1.0 public-business-contact-discovery', accept: 'text/html,application/xhtml+xml' }, redirect: 'follow', signal: AbortSignal.timeout(8000), cache: 'no-store' });
    if (!response.ok) return null;
    const html = await response.text();
    return html.length > 1_500_000 ? html.slice(0, 1_500_000) : html;
}

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => ({}));
    const target = validTarget(body.url);
    if (!target) return NextResponse.json({ emails: [], source: 'none' });
    try {
        const html = await fetchPage(target.toString());
        if (!html) return NextResponse.json({ emails: [], source: 'website-unavailable' });
        const emails = new Set(extractEmails(html));
        for (const link of contactLinks(html, target)) {
            try { const contactHtml = await fetchPage(link); if (contactHtml) extractEmails(contactHtml).forEach(email => emails.add(email)); } catch { /* Contact pages are optional. */ }
            if (emails.size >= 4) break;
        }
        return NextResponse.json({ emails: [...emails].slice(0, 4), source: emails.size ? 'public-website' : 'not-found' });
    }
    catch { return NextResponse.json({ emails: [], source: 'unavailable' }); }
}
