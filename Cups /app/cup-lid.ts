import * as THREE from 'three';

// Trace the closed shell from the lower axis, out around the rim, then back to
// the upper axis. Reversing this profile makes the exterior back-facing.
export function createPaperLid(radius: number): THREE.Group {
    if (!Number.isFinite(radius) || radius <= 0) throw Error('A lid needs a positive cup radius.');
    const heightScale = radius / .8;
    const profile = [
        [0, -.05], [.98, -.05], [1.05, -.035], [1.05, .015],
        [.98, .065], [.83, .065], [.82, .115], [.76, .13], [0, .13],
    ].map(([r, y]) => new THREE.Vector2(r * radius, y * heightScale));
    const material = new THREE.MeshStandardMaterial({ color: '#202020', roughness: .65, envMapIntensity: .4, side: THREE.FrontSide });
    const lid = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.LatheGeometry(profile, 128), material);
    shell.name = 'paper-lid-shell';
    lid.add(shell);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius * 1.045, .018 * heightScale, 10, 128), material);
    ring.name = 'paper-lid-locking-ring';
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -.005 * heightScale;
    lid.add(ring);
    return lid;
}
