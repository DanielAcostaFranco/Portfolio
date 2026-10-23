import { describe, it, expect, vi } from 'vitest';
import sharp from 'sharp';
import type { GoogleGenAI } from '@google/genai';
import { illustrateDirections } from '../app/ai-artwork';
import { demoVariations, catalogDesign } from '../app/designs';
const variants = () => demoVariations('navidad', catalogDesign(0, '#b73825', '#f8e9cf'), { scale: 90, horizontal: 0, vertical: 0 });
describe('original AI illustrations', () => {
    it('decodes and normalizes three provider images, preserving each approved design', async () => {
        const png = await sharp({ create: { width: 8, height: 8, channels: 4, background: '#b73825' } }).png().toBuffer();
        const generateContent = vi.fn().mockResolvedValue({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: png.toString('base64') } }] } }] });
        const source = variants();
        const result = await illustrateDirections({ models: { generateContent } } as unknown as GoogleGenAI, source, 'Sunday Coffee', 'Holiday pines', 'image-model');
        expect(result).toHaveLength(3);
        expect(generateContent).toHaveBeenCalledTimes(3);
        expect(source[0].design.artwork).toBeUndefined();
        expect(result[0].design.color).toBe(source[0].design.color);
        expect(result[0].placement).toEqual(source[0].placement);
        const image = Buffer.from(result[0].design.artwork!.split(',')[1], 'base64');
        const metadata = await sharp(image).metadata();
        expect(metadata.width).toBe(1024);
        expect(metadata.height).toBe(1024);
    });
    it('fails the entire set if an image is blocked or absent, without inventing artwork', async () => {
        const generateContent = vi.fn().mockResolvedValue({ candidates: [{ content: { parts: [{ text: 'Unable to generate' }] } }] });
        await expect(illustrateDirections({ models: { generateContent } } as unknown as GoogleGenAI, variants(), 'Sunday', 'Christmas', 'image-model')).rejects.toThrow('Illustration unavailable');
    });
    it('rejects malformed image bytes even when the claimed MIME type is valid', async () => {
        const generateContent = vi.fn().mockResolvedValue({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'aW52YWxpZA==' } }] } }] });
        await expect(illustrateDirections({ models: { generateContent } } as unknown as GoogleGenAI, variants(), 'Sunday', 'Christmas', 'image-model')).rejects.toThrow();
    });
});
