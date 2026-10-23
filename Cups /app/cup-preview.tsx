"use client";
import dynamic from 'next/dynamic';
import { catalogDesign, type DesignSpec } from './designs';
import type { CupProduct, PrintPlacement } from './cup-model';
const Cup3D = dynamic(() => import('./cup-3d').then(m => m.Cup3D), { ssr: false, loading: () => <div className="cup-canvas-wrap" aria-busy="true"/> });
export type CupBrand = {
    name: string;
    mark: string;
    color: string;
    accent: string;
    logo: string;
    demo: boolean;
};
export function CupPreview({ brand, product, direction = 0, placement = { scale: 100, horizontal: 0, vertical: 0 }, knockout = false, design }: {
    brand: CupBrand;
    product: CupProduct;
    direction?: number;
    seasonal?: boolean;
    placement?: PrintPlacement;
    resolution?: number;
    knockout?: boolean;
    design?: DesignSpec;
}) {
    return <div className="cup-canvas-wrap"><Cup3D brand={brand} product={product} design={design ?? catalogDesign(direction, brand.color, brand.accent)} placement={placement} knockout={knockout} interactive={false}/></div>;
}
