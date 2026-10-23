import type { Material } from './cup-model';
// Alpha describes the cup's coating, never its printed logo or its physical walls.
export function surfaceOpacity(material: Material, value?: number): number {
    if (material !== 'clear')
        return 1;
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}
export function petFinish(alpha: number) {
    const opacity = surfaceOpacity('clear', alpha);
    return {
        opacity: .045 + opacity * .955,
        transmission: 1 - opacity,
        roughness: .035 + opacity * .405,
        innerOpacity: .025 + opacity * .975,
        rimOpacity: .20 + opacity * .80,
    };
}
// Picking a tint should never jump from clear plastic to a solid painted cup.
export function opacityAfterColorChange(material: Material, current?: number) {
    return material === 'clear' ? surfaceOpacity(material, current) || .25 : 1;
}
