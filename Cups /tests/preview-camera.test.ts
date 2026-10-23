import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { fitPreviewCamera } from '../app/preview-camera';
import { cupDimensions } from '../app/studio-options';

describe('static product framing', () => {
    it.each([.55, 1, 1.75, 3.5])('keeps the complete cup and lid inside a %s aspect-ratio preview', aspect => {
        for (const material of ['paper', 'foam', 'clear'] as const) {
            for (const size of [8, 12, 16, 20, 24] as const) {
                const { top, height } = cupDimensions({ material, size });
                const radius = top * 1.08;
                const bounds = new THREE.Box3(new THREE.Vector3(-radius, -height / 2, -radius), new THREE.Vector3(radius, height / 2 + .2, radius));
                const camera = new THREE.PerspectiveCamera(31, 1, .1, 50);

                fitPreviewCamera(camera, bounds, aspect);

                for (const x of [bounds.min.x, bounds.max.x])
                    for (const y of [bounds.min.y, bounds.max.y])
                        for (const z of [bounds.min.z, bounds.max.z]) {
                            const screen = new THREE.Vector3(x, y, z).project(camera);
                            expect(Math.abs(screen.x)).toBeLessThanOrEqual(.821);
                            expect(Math.abs(screen.y)).toBeLessThanOrEqual(.821);
                            expect(screen.z).toBeGreaterThan(-1);
                            expect(screen.z).toBeLessThan(1);
                        }
            }
        }
    });
    it.each([0, NaN, Infinity])('uses a square frame for an invalid aspect ratio: %s', aspect => {
        const camera = new THREE.PerspectiveCamera(31);
        fitPreviewCamera(camera, new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1)), aspect);
        expect(camera.aspect).toBe(1);
        expect(camera.position.length()).toBeGreaterThan(0);
        expect(Number.isFinite(camera.position.z)).toBe(true);
    });
});
