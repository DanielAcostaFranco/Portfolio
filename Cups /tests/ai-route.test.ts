import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
const provider = vi.hoisted(() => ({ generate: vi.fn() }));
vi.mock("@google/genai", () => ({ GoogleGenAI: class {
        models = { generateContent: provider.generate };
    } }));
import { POST, GET } from "../app/api/ai/design/route";
import { demoVariations, catalogDesign } from "../app/designs";
const body = { prompt: "Botanical, green, smaller logo and higher", brandName: "Sunday Coffee", color: "#b73825", accent: "#f8e9cf", pattern: "pure", placement: { scale: 100, horizontal: 0, vertical: 0 } };
const request = (data: unknown = body, origin?: string) => new NextRequest("http://localhost:3000/api/ai/design", { method: "POST", headers: { "Content-Type": "application/json", ...(origin ? { origin } : {}) }, body: JSON.stringify(data) });
function live() { vi.stubEnv("GEMINI_API_KEY", "test-key-not-a-real-secret"); vi.stubEnv("KV_REST_API_URL", "https://quota.example.test"); vi.stubEnv("KV_REST_API_TOKEN", "test-token"); vi.stubEnv("AI_VISITOR_SECRET", "test-signing-secret"); }
beforeEach(() => { provider.generate.mockReset(); for (const key of ["GEMINI_API_KEY", "GEMINI_IMAGE_MODEL", "KV_REST_API_URL", "KV_REST_API_TOKEN", "AI_VISITOR_SECRET"])
    vi.stubEnv(key, ""); });
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
describe("design refinement boundary", () => {
    it("clearly labels usable previews without credentials and makes no network calls", async () => { const network = vi.spyOn(globalThis, "fetch"); const response = await POST(request()); const data = await response.json(); expect(response.status).toBe(200); expect(data.source).toBe("demo"); expect(data.variants).toHaveLength(3); expect(network).not.toHaveBeenCalled(); expect(provider.generate).not.toHaveBeenCalled(); });
    it("keeps live mode disabled when persistent quota storage is missing", async () => { vi.stubEnv("GEMINI_API_KEY", "test-key"); expect((await (await GET()).json()).mode).toBe("demo"); });
    it("rejects a brief that is too short", async () => expect((await POST(request({ ...body, prompt: "a" }))).status).toBe(400));
    it("rejects cross-origin generation requests", async () => expect((await POST(request(body, "https://other.example"))).status).toBe(403));
    it("rejects oversized request bodies", async () => expect((await POST(request({ ...body, prompt: "x".repeat(17000) }))).status).toBe(413));
    it("blocks a live provider call if the atomic quota reservation is denied", async () => { live(); vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ result: 0 })); expect((await POST(request())).status).toBe(429); expect(provider.generate).not.toHaveBeenCalled(); });
    it("does not call Gemini when the quota store fails", async () => { live(); vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("unavailable", { status: 503 })); expect((await POST(request())).status).toBe(503); expect(provider.generate).not.toHaveBeenCalled(); });
    it("validates live results and sets a signed visitor cookie", async () => { live(); vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ result: 1 })); const variants = demoVariations(body.prompt, catalogDesign(0, body.color, body.accent), body.placement).map(v => ({ ...v.design, ...v.placement, reason: v.reason })); provider.generate.mockResolvedValue({ text: JSON.stringify({ variants }) }); const response = await POST(request()); expect(response.status).toBe(200); expect((await response.json()).source).toBe("gemini"); expect(response.cookies.get("cup-ai-visitor")?.value).toMatch(/^[a-f0-9-]+\.[a-f0-9]{64}$/); expect(provider.generate).toHaveBeenCalledTimes(1); });
    it("fails malformed provider output without retrying or exposing details", async () => { live(); vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ result: 1 })); provider.generate.mockResolvedValue({ text: "not json" }); const response = await POST(request()); expect(response.status).toBe(502); expect(provider.generate).toHaveBeenCalledTimes(1); expect(JSON.stringify(await response.json())).not.toContain("test-key"); });
});
