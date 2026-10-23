import { describe, expect, it } from 'vitest';
import { discoverLogoCandidates } from '../app/brand-discovery';

describe('website logo discovery', () => {
    it('prioritizes JSON-LD logo, social image, icon, and logo-like image sources', () => {
        const html = `<title>Acme Coffee</title>
            <script type="application/ld+json">{"@type":"Organization","logo":"/brand.svg"}</script>
            <meta property="og:image" content="/social.png"><link rel="icon" href="/favicon.png">
            <img class="header-logo" src="/wordmark.webp">`;
        const result = discoverLogoCandidates(html, 'https://acme.example/shop');
        expect(result.name).toBe('Acme Coffee');
        expect(result.candidates.map(candidate => candidate.url)).toEqual([
            'https://acme.example/brand.svg', 'https://acme.example/social.png', 'https://acme.example/wordmark.webp', 'https://acme.example/favicon.png', 'https://acme.example/favicon.ico'
        ]);
    });
    it('ignores unsafe and duplicate image sources', () => {
        const result = discoverLogoCandidates('<title>x</title><img alt="logo" src="javascript:alert(1)"><img alt="logo" src="/favicon.ico">', 'https://x.example');
        expect(result.candidates.map(candidate => candidate.url)).toEqual(['https://x.example/favicon.ico']);
    });
});
