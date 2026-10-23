# Custom Cup Studio

Minimal cup design studio built with Next.js, React, Canvas, and Three.js.

## Run and verify

```bash
npm install
npm run dev
npm test
npm run build
```

Open http://localhost:3000. Run only one dev server for this project. Development uses .next-dev; production uses .next.

## Experience

1. Paste a URL, upload a transparent PNG/SVG logo, or select a fictional demo.
2. Compare three initial brand directions before entering the editor. Uploaded logos are sampled locally to extract a primary and contrasting accent palette.
3. Customize an actual 3D tapered cup: orbit in every direction, zoom, reset the camera, or use arrow keys and Home while the canvas is focused.
4. Choose cup, print, accent and message colors independently. PET starts transparent and adds a 0–100% cup-opacity slider with Transparent, Tinted and Solid presets next to the color picker. Opacity affects only the cup coating, not the logo/print. Paper and foam remain opaque. Add a message, scale the logo, and move it vertically/horizontally.
5. Choose paper (8/12/16 oz), foam (8/12/16/20 oz), or clear PET (12/16/20/24 oz). Paper starts open, with an optional black lid. Foam has a wider/shorter profile, a thick insulated wall, rounded rim and cellular bump texture. PET uses thin transparent walls with separately sorted reverse/outer ink layers so a logo is visible, mirrored, through the back. Color changes start at a 25% translucent tint rather than solid paint; the 0–100% opacity control remains independent.
6. Explore twelve everyday print styles and four full seasonal compositions: holiday pines/candy ribbons, summer citrus, Valentine hearts/leaves, Halloween pumpkins/bats. The Collection menu is a curated local library, not an AI generation.
7. Improve with AI accepts a bilingual brief and compares three directions before applying a result. Original AI illustrations require the image model configuration below.
8. Download the current 3D camera view as PNG, or continue to proposal and outreach. All comparison, proposal and outreach cards now use the same 3D renderer and print configuration, including lid, message font and wrap printing.

PNG/SVG transparency is retained. Edge-connected near-white backgrounds are removed by default, with an opt-out in More adjustments. Enclosed white details and the original file remain intact. SVG logos must be self-contained, without scripts, external images, animation or active content. Files stay in browser memory and are never sent to the provider. Reloading clears the design session.

The URL flow currently derives a name placeholder only. Website inspection, brand guideline extraction, and official logo discovery are NOT implemented. Upload a logo for a real palette; the UI explicitly explains this. The three demos (Sunday Coffee, Morrow Juice, Luna Bakehouse) are fictional.

3D dimensions and capacities are illustrative proportions, not calibrated supplier SKUs. The meshes have actual geometry and full-wrap print textures; logo pixels are not redrawn by AI. Original logo/message pixels are rendered as a separate sRGB ink layer with tone mapping disabled, so studio lighting does not lighten or recolor the uploaded mark. Paper/foam and decoration retain material lighting. Legacy photographic templates remain in public assets but are no longer used for cup preview cards. These are previews, not production-ready dielines, ink separations or color proofs.

## Wrap printing and message fonts

- Front only, front + back, or a 24-mark staggered all-over logo print. Both-side printing can use the same original logo or a separate PNG/SVG uploaded for the back. Wrap seams are tiled rather than clipping the reverse logo.
- Original colors are the default. A separate Logo color picker creates a single-ink version using the logo alpha mask; Original colors restores the source without mutating the file. Cup, pattern, logo and message colors are independent.
- Message font choices include sans, editorial serif, humanist, typewriter and classic serif. Upload WOFF/WOFF2/TTF/OTF (up to 5 MB) to register a local FontFace and use it on the canvas. Font signatures and browser decoding are checked; failed uploads preserve the current font. Only upload fonts you are allowed to use.
- Fonts and logos remain in browser memory for the session. Uploaded font choices survive editor/proposal navigation, but not a page reload. Font files and custom reverse-logo pixels are never sent to the AI provider.
- Print layout, custom reverse logo, selected font, original/custom logo ink, lid and coating opacity survive style changes and AI refinement. Back view and Reset view provide camera shortcuts; neither changes the design.

## AI configuration

Copy .env.example to .env.local and configure server-only values:

- GEMINI_API_KEY: your Google AI project key.
- GEMINI_MODEL: structured creative-planning model, default gemini-2.5-flash-lite.
- GEMINI_IMAGE_MODEL: optional image-capable Gemini model available in your project. When set, each generation makes one planning call and three image calls in parallel. The model creates flat decorative illustrations; the original logo is composited separately in the browser. Sharp validates, normalizes and compresses each image. The artwork is recolored into the editable two-ink palette and wrapped around the 3D cup. Confirm model availability, quotas and billing in your Google project.
- KV_REST_API_URL and KV_REST_API_TOKEN: Upstash-compatible Redis REST endpoint/token supporting EVAL.
- AI_VISITOR_SECRET: long random signing secret.
- AI_DAILY_LIMIT (default 30) and AI_VISITOR_DAILY_LIMIT (default 5): limits on direction sets, not individual images. A set with image generation can make four model calls. Each visitor has a 12-second cooldown; a Redis Lua reservation checks/increments limits atomically. Failed calls still consume a reservation. Clearing cookies cannot bypass the global cap.

Three explicit modes:
- No complete credentials/quota configuration: deterministic Studio preview, clearly labeled not AI-generated.
- Planning model only: AI art direction using the supported motif library, not unrestricted image generation.
- Planning + image model: original raster artwork for all three directions, including bespoke seasonal illustrations.

Brief, business name, colors and creative parameters are sent to Google. The approved logo and its original pixels remain local. Results are validated against a bounded schema. Provider HTML/SVG/code/URLs are never executed. Requests have same-origin checks, bounded input, timeouts, no automatic retries, and durable quota reservations. An image failure fails the whole generation and leaves the current cup untouched; the user may explicitly choose local previews. The current environment has no live Gemini credentials, so real provider output has not been verified.

References: [Gemini image generation](https://ai.google.dev/gemini-api/docs/generate-content/image-generation), [structured outputs](https://ai.google.dev/gemini-api/docs/generate-content/structured-output), [SDK image configuration](https://googleapis.github.io/js-genai/release_docs/interfaces/types.ImageConfig.html).

## Proposal and outreach

Prices are sample USD values calculated using integer cents; unit price is editable. Shipping, taxes and production approval are unconfirmed. Save proposal as PDF opens the browser print dialog. Outreach requires a manually confirmed recipient and review checkbox before copying an email. No checkout, subscription billing, email sending or verified business contact is invented.

## Verification

Vitest covers pricing, capacities, logo projection, background removal, palette extraction, SVG validation, seasonal briefs, bounded provider output, request/quota boundaries, and actual decoding/compression of mocked image results. Browser checks cover brand directions, 3D camera/reset, live color/message updates, material/size changes, seasonal previews, AI fallback, responsive layout and PNG download.

Known dependency audit findings from the existing Next.js/Vitest baseline remain; this prototype should receive a dependency/security upgrade before public deployment.
