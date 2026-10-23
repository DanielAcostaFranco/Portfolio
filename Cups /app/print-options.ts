export type LogoLayout = 'front' | 'both' | 'repeat';
export type PrintOptions = {
    lid?: boolean;
    logoLayout?: LogoLayout;
    logoColor?: string;
    backLogo?: string;
    messageFont?: string;
};
export const MESSAGE_FONTS = [
    { value: 'Arial', label: 'Modern sans' },
    { value: 'Georgia', label: 'Editorial serif' },
    { value: 'Trebuchet MS', label: 'Humanist' },
    { value: 'Courier New', label: 'Typewriter' },
    { value: 'Times New Roman', label: 'Classic serif' },
] as const;
export type LogoStamp = {
    u: number;
    v: number;
    scale: number;
    back: boolean;
};
export function logoStamps(layout: LogoLayout = 'front'): LogoStamp[] {
    if (layout === 'both')
        return [{ u: .5, v: .5, scale: 1, back: false }, { u: 0, v: .5, scale: 1, back: true }];
    if (layout === 'repeat')
        return Array.from({ length: 24 }, (_, i) => ({ u: ((i % 6 + .5 + (Math.floor(i / 6) % 2) * .5) / 6) % 1, v: .18 + Math.floor(i / 6) * .215, scale: .38, back: false }));
    return [{ u: .5, v: .5, scale: 1, back: false }];
}
export function fontFamily(value?: string) {
    return value && (MESSAGE_FONTS.some(f => f.value === value) || /^StudioFont-[a-z0-9-]+$/i.test(value)) ? value : 'Arial';
}
export function validateFontFile(name: string, size: number, bytes: Uint8Array) {
    if (!/\.(woff2?|ttf|otf)$/i.test(name) || size > 5 * 1024 * 1024 || bytes.length < 4)
        throw Error('Choose a WOFF, WOFF2, TTF or OTF font under 5 MB.');
    const signature = String.fromCharCode(...bytes.slice(0, 4));
    if (!['wOFF', 'wOF2', 'OTTO', 'true'].includes(signature) && !bytes.slice(0, 4).every((v, i) => v === [0, 1, 0, 0][i]))
        throw Error('This file is not a supported font.');
}
export function retainPrintOptions<T extends object>(next: T, current: PrintOptions): T & PrintOptions {
    return { ...next, lid: current.lid, logoLayout: current.logoLayout, logoColor: current.logoColor, backLogo: current.backLogo, messageFont: current.messageFont };
}
