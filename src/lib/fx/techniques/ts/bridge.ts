import { fromBundleMemory, asBundleMemory } from '@lib/fx/bytecode/VM/ts/bundle';
import { Bundle, BundleContent, BundleT } from '@lib/idl/bundles/FxBundle_generated';
import * as Bytecode from '@lib/idl/bytecode';
import { IEmitter } from '@lib/idl/emitter';
import { ITechnique } from '@lib/idl/ITechnique';
import * as flatbuffers from 'flatbuffers';
import { copyTsEmitter, createTsEmitter, destroyTsEmitter } from './emitter';
import { copyTsMaterial, createTsMaterial, destroyTsMaterial } from './mat';

const isEmitter = tech => tech?.getType() === 'emitter';
const isMat = tech => tech?.getType() === 'material';


function decodeBundleData(data: Uint8Array | BundleT): BundleT {
    // load from packed version, see PACKED in @lib/fx/bundles/Bundle.ts
    if (data instanceof Uint8Array) {
        let fx = new BundleT();
        let buf = new flatbuffers.ByteBuffer(data);
        Bundle.getRootAsBundle(buf).unpackTo(fx);
        return fx;
    }

    return <BundleT>data;
}


export function createTechnique(data: Uint8Array | BundleT): ITechnique {
    const bundle = decodeBundleData(data);

    if (bundle.contentType === BundleContent.PartBundle) {
        const emitter = createTsEmitter(bundle);
        emitter.reset();
        return emitter;
    }

    if (bundle.contentType === BundleContent.MatBundle) {
        const mat = createTsMaterial(bundle);
        return mat;
    }

    return null;
}


export function destroyTechnique(tech: ITechnique): void {
    if (isEmitter(tech)) {
        destroyTsEmitter(<IEmitter>tech);
        return;
    }
    if (isMat(tech)) {
        destroyTsMaterial(tech);
        return;
    }
}


export function copyTechnique(dst: ITechnique, src: ITechnique): boolean {
    if (isEmitter(dst) && isEmitter(src)) {
        return copyTsEmitter(<IEmitter>dst, <IEmitter>src);
    }
    if (isMat(dst) && isMat(src)) {
        return copyTsMaterial(<IEmitter>dst, <IEmitter>src);
    }
    return false;
}

//
//
//

export function memoryToU8Array(input: Bytecode.IMemory): Uint8Array {
    const buffer = fromBundleMemory(input);
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}


export function memoryToF32Array(input: Bytecode.IMemory): Float32Array {
    const buffer = fromBundleMemory(input);
    return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length);
}


export function memoryToI32Array(input: Bytecode.IMemory): Int32Array {
    return fromBundleMemory(input);
}

/**
 * @deprecated
 */
export function f32ArrayToMemory(input: Float32Array): Bytecode.IMemory {
    return asBundleMemory(input);
}

/**
 * @deprecated
 */
export function u32ArrayToMemory(input: Uint32Array): Bytecode.IMemory {
    return asBundleMemory(input);
}


export function viewToMemory(input: ArrayBufferView): Bytecode.IMemory {
    return asBundleMemory(input);
}
