import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {registerLocalFont,uploadedFontOptions} from '../app/local-brand-assets';
const load=vi.fn(),add=vi.fn();
const file=(name='Brand.ttf',size=100)=>({name,size,arrayBuffer:vi.fn().mockResolvedValue(new Uint8Array([0,1,0,0]).buffer)}) as unknown as File;
beforeEach(()=>{
    uploadedFontOptions.length=0;load.mockReset().mockResolvedValue({});add.mockReset();
    vi.stubGlobal('FontFace',class {constructor(public family:string,public source:ArrayBuffer){} load(){return load();}});
    vi.stubGlobal('document',{fonts:{add}});
});
afterEach(()=>{uploadedFontOptions.length=0;vi.unstubAllGlobals();});
describe('browser-local font registration',()=>{
    it('registers a decoded face and keeps a reusable session option',async()=>{
        const option=await registerLocalFont(file());expect(option.value).toMatch(/^StudioFont-/);expect(option.label).toBe('Brand');expect(uploadedFontOptions).toEqual([option]);expect(add).toHaveBeenCalledTimes(1);
    });
    it('does not replace or register a font if browser decoding fails',async()=>{
        uploadedFontOptions.push({value:'StudioFont-existing',label:'Existing'});load.mockRejectedValue(Error('Invalid font bytes'));
        await expect(registerLocalFont(file())).rejects.toThrow('Invalid font bytes');expect(uploadedFontOptions).toEqual([{value:'StudioFont-existing',label:'Existing'}]);expect(add).not.toHaveBeenCalled();
    });
    it('rejects oversized font files before reading their bytes',async()=>{
        const large=file('Large.ttf',6*1024*1024);await expect(registerLocalFont(large)).rejects.toThrow('under 5 MB');expect(large.arrayBuffer).not.toHaveBeenCalled();expect(add).not.toHaveBeenCalled();
    });
});
