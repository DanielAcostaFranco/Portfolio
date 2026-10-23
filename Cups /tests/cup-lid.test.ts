import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createPaperLid } from '../app/cup-lid';

function shellAt(radius: number) {
    const lid = createPaperLid(radius);
    lid.updateMatrixWorld(true);
    return lid.getObjectByName('paper-lid-shell') as THREE.Mesh<THREE.LatheGeometry, THREE.MeshStandardMaterial>;
}
describe('closed paper cup lid', () => {
    it.each([.70, .80, .90])('covers the opening with outward-facing top triangles at radius %s', radius => {
        const shell = shellAt(radius);
        expect(shell.material.side).toBe(THREE.FrontSide);
        for (const fraction of [0, .3, .65]) {
            const hits = new THREE.Raycaster(new THREE.Vector3(radius * fraction, 2, 0), new THREE.Vector3(0, -1, 0)).intersectObject(shell);
            expect(hits.length).toBeGreaterThan(0);
            expect(hits[0].face!.normal.y).toBeGreaterThan(.99);
            expect(hits[0].point.y).toBeGreaterThan(0);
        }
    });
    it('has a closed opaque underside when the cup is flipped', () => {
        const hits = new THREE.Raycaster(new THREE.Vector3(.2, -2, 0), new THREE.Vector3(0, 1, 0)).intersectObject(shellAt(.8));
        expect(hits.length).toBeGreaterThan(0);
        expect(hits[0].face!.normal.y).toBeLessThan(-.99);
        expect(hits[0].point.y).toBeLessThan(0);
    });
    it('retains its exterior sidewall from all four directions', () => {
        const shell = shellAt(.8);
        for (const [x, z] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const ray = new THREE.Raycaster(new THREE.Vector3(x * 3, 0, z * 3), new THREE.Vector3(-x, 0, -z));
            expect(ray.intersectObject(shell).length).toBeGreaterThan(0);
        }
    });
    it('rejects invalid dimensions instead of producing broken geometry', () => {
        expect(() => createPaperLid(0)).toThrow();
        expect(() => createPaperLid(NaN)).toThrow();
    });
});
