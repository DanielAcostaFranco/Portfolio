import { validateLogoSvg } from './studio-options';
import { loadCupImage } from './cup-artwork';
import { validateFontFile } from './print-options';
export async function readLocalLogo(file: File) {
    if (!['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)
        throw Error('Choose a PNG or SVG logo under 5 MB.');
    if (file.type === 'image/svg+xml')
        validateLogoSvg((await file.text()).replace(/<\?xml[^>]*\?>/g, '').trim());
    const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(Error('Could not read logo.')); reader.readAsDataURL(file); });
    await loadCupImage(data);
    return data;
}
export const uploadedFontOptions: {
    value: string;
    label: string;
}[] = [];
export async function registerLocalFont(file: File) {
    if (file.size > 5 * 1024 * 1024)
        throw Error('Choose a font under 5 MB.');
    const bytes = await file.arrayBuffer();
    validateFontFile(file.name, file.size, new Uint8Array(bytes));
    const family = 'StudioFont-' + crypto.randomUUID();
    const font = new FontFace(family, bytes);
    await font.load();
    document.fonts.add(font);
    const option = { value: family, label: file.name.replace(/\.[^.]+$/, '') };
    uploadedFontOptions.push(option);
    return option;
}
