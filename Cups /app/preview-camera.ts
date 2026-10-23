import * as THREE from 'three';

// Keep the entire product inside the frame, including wide, height-limited cards.
export function fitPreviewCamera(camera: THREE.PerspectiveCamera, bounds: THREE.Box3, aspect: number) {
    const center = bounds.getCenter(new THREE.Vector3());
    const direction = new THREE.Vector3(0, 2.09, 5.7).normalize();
    const right = new THREE.Vector3(1, 0, 0);
    const up = new THREE.Vector3().crossVectors(direction, right);
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
    let distance = 0;
    for (const x of [bounds.min.x, bounds.max.x])
        for (const y of [bounds.min.y, bounds.max.y])
            for (const z of [bounds.min.z, bounds.max.z]) {
                const corner = new THREE.Vector3(x, y, z).sub(center);
                distance = Math.max(distance, corner.dot(direction) + Math.max(Math.abs(corner.dot(right)) / (tan * safeAspect * .82), Math.abs(corner.dot(up)) / (tan * .82)));
            }
    camera.aspect = safeAspect;
    camera.position.copy(center).addScaledVector(direction, distance);
    camera.lookAt(center);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    return center;
}
