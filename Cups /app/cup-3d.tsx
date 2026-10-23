"use client";
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { petFinish } from './cup-surface';
import { createPaperLid } from './cup-lid';
import { fitPreviewCamera } from './preview-camera';
import { cupPrintLayers, WRAP_WIDTH, WRAP_HEIGHT } from './cup-artwork';
import { cupDimensions } from './studio-options';
import type { CupBrand } from './cup-preview';
import { productLabel, type CupProduct, type PrintPlacement } from './cup-model';
import type { DesignSpec } from './designs';
type Props = {
    brand: CupBrand;
    product: CupProduct;
    design: DesignSpec;
    placement: PrintPlacement;
    knockout: boolean;
    interactive?: boolean;
};
type Engine = {
    surface: THREE.CanvasTexture;
    ink: THREE.CanvasTexture;
    body: THREE.MeshPhysicalMaterial;
    rim: THREE.MeshPhysicalMaterial;
    inside: THREE.MeshPhysicalMaterial;
    lid: THREE.Group;
    grain: THREE.CanvasTexture | null;
    reset: () => void;
    back: () => void;
    render: () => void;
};
function foamGrain() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 192;
    const ctx = canvas.getContext('2d')!, pixels = ctx.createImageData(192, 192);
    let seed = 7319;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const cells = Array.from({ length: 110 }, () => ({ x: random() * 192, y: random() * 192, value: random() }));
    for (let y = 0; y < 192; y++)
        for (let x = 0; x < 192; x++) {
            let nearest = 1e9, second = 1e9, shade = 0;
            for (const cell of cells) {
                const dx = Math.min(Math.abs(cell.x - x), 192 - Math.abs(cell.x - x)), dy = Math.min(Math.abs(cell.y - y), 192 - Math.abs(cell.y - y)), d = dx * dx + dy * dy;
                if (d < nearest) {
                    second = nearest;
                    nearest = d;
                    shade = cell.value;
                }
                else if (d < second)
                    second = d;
            }
            const edge = Math.min(1, (Math.sqrt(second) - Math.sqrt(nearest)) / 2.5), value = Math.round(130 + edge * 92 + shade * 25);
            pixels.data.set([value, value, value, 255], (y * 192 + x) * 4);
        }
    ctx.putImageData(pixels, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(5, 3);
    return texture;
}
export function Cup3D({ brand, product, design, placement, knockout, interactive = true }: Props) {
    const host = useRef<HTMLDivElement>(null), engine = useRef<Engine | null>(null);
    const [status, setStatus] = useState('loading'), [revision, setRevision] = useState(0);
    useEffect(() => {
        if (!host.current)
            return;
        const mount = host.current;
        let renderer: THREE.WebGLRenderer;
        try {
            renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
        }
        catch {
            setStatus('error');
            return;
        }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor('#ffffff');
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = .95;
        const canvas = renderer.domElement;
        canvas.className = 'cup-webgl';
        canvas.setAttribute('role', 'img');
        canvas.tabIndex = interactive ? 0 : -1;
        canvas.dataset.ready = 'false';
        mount.prepend(canvas);
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#ffffff');
        const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment(), environment = pmrem.fromScene(room, .04);
        scene.environment = environment.texture;
        scene.environmentIntensity = .65;
        room.dispose();
        pmrem.dispose();
        const camera = new THREE.PerspectiveCamera(31, 1, .1, 50);
        camera.position.set(0, 2.15, 5.7);
        const controls = new OrbitControls(camera, canvas);
        controls.enabled = interactive;
        controls.enableDamping = interactive;
        controls.dampingFactor = .12;
        controls.enablePan = false;
        controls.minDistance = 3.3;
        controls.maxDistance = 10;
        controls.minPolarAngle = .001;
        controls.maxPolarAngle = Math.PI - .001;
        controls.target.set(0, .06, 0);
        controls.update();
        controls.saveState();
        scene.add(new THREE.HemisphereLight('#ffffff', '#c5c1ba', 1.1));
        const key = new THREE.DirectionalLight('#fff9f2', 2);
        key.position.set(-3, 5, 5);
        scene.add(key);
        const fill = new THREE.DirectionalLight('#ffffff', 1);
        fill.position.set(4, 2, -2);
        scene.add(fill);
        const { top, bottom, height, wall } = cupDimensions(product), clear = product.material === 'clear', foam = product.material === 'foam';
        const body = new THREE.MeshPhysicalMaterial({ color: '#ffffff', transparent: clear, opacity: clear ? .045 : 1, depthWrite: !clear, roughness: clear ? .035 : foam ? .98 : .61, metalness: 0, transmission: 0, clearcoat: clear ? 1 : foam ? 0 : .04, side: THREE.FrontSide });
        const rim = body.clone();
        const inside = new THREE.MeshPhysicalMaterial({ color: foam ? '#fffffc' : '#fcfbf8', transparent: clear, opacity: clear ? .025 : 1, depthWrite: !clear, roughness: foam ? 1 : clear ? .1 : .8, transmission: 0, side: THREE.BackSide });
        const group = new THREE.Group();
        scene.add(group);
        const add = (geometry: THREE.BufferGeometry, material: THREE.Material, y = 0) => { const mesh = new THREE.Mesh(geometry, material); mesh.position.y = y; mesh.renderOrder = clear ? 1 : 0; group.add(mesh); return mesh; };
        const geometry = new THREE.CylinderGeometry(top, bottom, height, 128, 48, true, -Math.PI);
        if (foam) {
            const positions = geometry.getAttribute('position');
            for (let i = 0; i < positions.count; i++) {
                const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i), t = (y + height / 2) / height, bulge = top * .007 * Math.exp(-Math.pow((t - .95) / .035, 2)), r = Math.hypot(x, z);
                positions.setXYZ(i, x * (1 + bulge / r), y, z * (1 + bulge / r));
            }
            geometry.computeVertexNormals();
        }
        add(geometry, body);
        add(new THREE.CylinderGeometry(top - wall, bottom - wall, height - wall, 128, 1, true, -Math.PI), inside, wall / 2);
        const floor = add(new THREE.CircleGeometry(bottom - wall, 128), inside, -height / 2 + wall);
        floor.rotation.x = Math.PI / 2;
        const base = add(new THREE.CircleGeometry(bottom, 128), rim, -height / 2);
        base.rotation.x = Math.PI / 2;
        const rimRadius = foam ? top - wall / 2 : top;
        for (const [radius, y, tube] of [[rimRadius, height / 2, foam ? wall / 2 : .018], [bottom, -height / 2 + .014, foam ? .020 : .013]]) {
            const lip = add(new THREE.TorusGeometry(radius, tube, 16, 128), rim, y);
            lip.rotation.x = Math.PI / 2;
        }
        if (foam) {
            for (const dy of [.04, .065]) {
                const foot = add(new THREE.TorusGeometry(bottom + .008, .009, 8, 128), rim, -height / 2 + dy);
                foot.rotation.x = Math.PI / 2;
            }
        }
        const grain = foam ? foamGrain() : null;
        if (grain) {
            body.bumpMap = grain;
            body.bumpScale = .017;
            rim.bumpMap = grain;
            rim.bumpScale = .012;
            inside.bumpMap = grain;
            inside.bumpScale = .008;
        }
        const makeTexture = (opaque: boolean) => { const source = document.createElement('canvas'); source.width = WRAP_WIDTH; source.height = WRAP_HEIGHT; if (opaque) {
            const c = source.getContext('2d')!;
            c.fillStyle = '#fff';
            c.fillRect(0, 0, WRAP_WIDTH, WRAP_HEIGHT);
        } const texture = new THREE.CanvasTexture(source); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); return texture; };
        const surface = makeTexture(!clear), ink = makeTexture(false);
        if (!clear)
            body.map = surface;
        // Color-managed, unlit ink keeps the original logo RGB untouched by studio lighting.
        const printGeometry = new THREE.CylinderGeometry(top + .004, bottom + .004, height, 128, 48, true, -Math.PI);
        if (foam)
            printGeometry.copy(geometry).scale(1.004, 1, 1.004);
        const printMaterial = new THREE.MeshBasicMaterial({ map: ink, transparent: true, depthWrite: false, side: THREE.FrontSide, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 });
        const frontPrint = add(printGeometry, printMaterial);
        frontPrint.renderOrder = 3;
        if (clear) {
            // The reverse of the SAME ink layer is mirrored naturally when viewed through PET.
            const reversePrint = add(printGeometry, new THREE.MeshBasicMaterial({ map: ink, transparent: true, depthWrite: false, side: THREE.BackSide, toneMapped: false }));
            reversePrint.renderOrder = 0;
        }
        const lid = product.material === 'paper' ? createPaperLid(top) : new THREE.Group();
        group.add(lid);
        lid.visible = false;
        lid.position.y = height / 2 + .025;
        const shadowCanvas = document.createElement('canvas');
        shadowCanvas.width = shadowCanvas.height = 128;
        const shadowCtx = shadowCanvas.getContext('2d')!;
        const gradient = shadowCtx.createRadialGradient(64, 64, 8, 64, 64, 64);
        gradient.addColorStop(0, '#00000032');
        gradient.addColorStop(1, '#00000000');
        shadowCtx.fillStyle = gradient;
        shadowCtx.fillRect(0, 0, 128, 128);
        const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
        const contact = new THREE.Mesh(new THREE.PlaneGeometry(bottom * 3.6, bottom * 3.6), new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }));
        contact.rotation.x = -Math.PI / 2;
        contact.position.y = -height / 2 - .018;
        scene.add(contact);
        const render = () => { contact.visible = camera.position.y > -height / 2; renderer.render(scene, camera); canvas.dataset.view = camera.position.toArray().map(n => n.toFixed(2)).join(','); };
        const resize = () => { const width = mount.clientWidth || 500, h = mount.clientHeight || width; renderer.setSize(width, h, false); camera.aspect = width / h;
            if (!interactive) {
                // Include the optional lid even before artwork has finished loading.
                const bounds = new THREE.Box3(new THREE.Vector3(-top * 1.08, -height / 2 - .03, -top * 1.08), new THREE.Vector3(top * 1.08, height / 2 + .2, top * 1.08));
                controls.target.copy(fitPreviewCamera(camera, bounds, width / h));
            }
            camera.updateProjectionMatrix(); render(); };
        const observer = new ResizeObserver(resize);
        observer.observe(mount);
        resize();
        const reset = () => { controls.reset(); render(); };
        const back = () => { const distance = camera.position.distanceTo(controls.target); camera.position.set(0, 2.15, -Math.sqrt(Math.max(1, distance * distance - 2.15 * 2.15))); controls.update(); render(); };
        const keyboard = (event: KeyboardEvent) => { if (!interactive || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key))
            return; event.preventDefault(); if (event.key === 'Home') {
            reset();
            return;
        } const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target)); spherical.theta += event.key === 'ArrowLeft' ? .18 : event.key === 'ArrowRight' ? -.18 : 0; spherical.phi += event.key === 'ArrowUp' ? -.18 : event.key === 'ArrowDown' ? .18 : 0; spherical.makeSafe(); camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical)); controls.update(); render(); };
        canvas.addEventListener('keydown', keyboard);
        engine.current = { surface, ink, body, rim, inside, lid, grain, reset, back, render };
        let frame = 0;
        const loop = () => { controls.update(); render(); frame = requestAnimationFrame(loop); };
        if (interactive)
            loop();
        setRevision(v => v + 1);
        const lost = (event: Event) => { event.preventDefault(); setStatus('error'); };
        canvas.addEventListener('webglcontextlost', lost);
        return () => { cancelAnimationFrame(frame); observer.disconnect(); controls.dispose(); canvas.removeEventListener('keydown', keyboard); canvas.removeEventListener('webglcontextlost', lost); engine.current = null; const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(); scene.traverse(object => { if (object instanceof THREE.Mesh) {
            geometries.add(object.geometry);
            (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m));
        } }); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); surface.dispose(); ink.dispose(); grain?.dispose(); shadowTexture.dispose(); environment.dispose(); renderer.dispose(); renderer.forceContextLoss(); canvas.remove(); };
    }, [product.material, product.size, interactive]);
    useEffect(() => {
        let cancelled = false;
        const current = engine.current;
        if (!current)
            return;
        setStatus('loading');
        const dims = cupDimensions(product), aspect = Math.PI * (dims.top + dims.bottom) / dims.height * (1024 / WRAP_WIDTH);
        cupPrintLayers(brand, product, design, placement, knockout, aspect).then(layers => {
            if (cancelled || engine.current !== current)
                return;
            const put = (texture: THREE.CanvasTexture, source: HTMLCanvasElement) => { const image = texture.image as HTMLCanvasElement, c = image.getContext('2d')!; c.clearRect(0, 0, WRAP_WIDTH, WRAP_HEIGHT); c.drawImage(source, 0, 0); texture.needsUpdate = true; };
            if(product.material==='foam'&&current.grain){
                // The cellular finish remains visible under soft studio lights, not just at grazing angles.
                const c=layers.surface.getContext('2d')!;c.save();c.globalCompositeOperation='multiply';c.globalAlpha=.11;
                for(let y=0;y<3;y++)for(let x=0;x<5;x++)c.drawImage(current.grain.image as HTMLCanvasElement,x*WRAP_WIDTH/5,y*WRAP_HEIGHT/3,WRAP_WIDTH/5,WRAP_HEIGHT/3);
                c.restore();
            }
            put(current.surface, layers.surface);
            if (product.material === 'clear') {
                const composite = document.createElement('canvas');
                composite.width = WRAP_WIDTH;
                composite.height = WRAP_HEIGHT;
                const c = composite.getContext('2d')!;
                c.drawImage(layers.surface, 0, 0);
                c.drawImage(layers.ink, 0, 0);
                put(current.ink, composite);
                const finish = petFinish(design.backgroundOpacity ?? 0), color = (design.backgroundOpacity ?? 0) > 0 ? design.background ?? '#ffffff' : '#ffffff';
                current.body.color.set(color);
                current.rim.color.set(color);
                current.body.opacity = finish.opacity;
                current.body.roughness = finish.roughness;
                current.rim.opacity = finish.rimOpacity;
                current.inside.opacity = finish.innerOpacity;
                current.inside.color.set('#ffffff');
                current.body.depthWrite = current.rim.depthWrite = current.inside.depthWrite = finish.transmission === 0;
            }
            else {
                put(current.ink, layers.ink);
                current.body.color.set('#ffffff');
                current.rim.color.set(design.background ?? '#ffffff');
            }
            current.lid.visible = product.material === 'paper' && Boolean(design.lid);
            current.render();
            const canvas = host.current?.querySelector('canvas');
            if (canvas) {
                canvas.dataset.ready = 'true';
                canvas.dataset.coatingOpacity = String(product.material === 'clear' ? Math.max(0, Math.min(1, design.backgroundOpacity ?? 0)) : 1);
                canvas.dataset.logoLayout = design.logoLayout ?? 'front';
                canvas.dataset.lid = String(current.lid.visible);
                canvas.setAttribute('aria-label', brand.name + (interactive ? ' interactive 3D ' : ' printed on a ') + productLabel(product));
            }
            setStatus('ready');
        }).catch(() => { if (!cancelled)
            setStatus('error'); });
        return () => { cancelled = true; const canvas = host.current?.querySelector('canvas'); if (canvas)
            canvas.dataset.ready = 'false'; };
    }, [brand, product, design, placement, knockout, revision, interactive]);
    return <div className={interactive ? 'three-stage' : 'three-stage static-preview'}><div ref={host} className="three-mount" aria-busy={status === 'loading'}/>{interactive && <div className="three-toolbar"><span>Drag to rotate · Scroll to zoom</span><div className="view-buttons"><button className="view-reset" onClick={() => engine.current?.back()}>Back view</button><button className="view-reset" onClick={() => engine.current?.reset()}>↺ Reset view</button></div></div>}{status === 'loading' && <span className="three-loading" role="status">Rendering…</span>}{status === 'error' && <p className="render-error" role="alert">Could not render this cup. Refresh to try again.</p>}</div>;
}
