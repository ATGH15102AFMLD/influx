import { IMemory } from '@lib/idl/bytecode';
import { IMap } from '@lib/idl/IMap';
import { Vector3 } from 'three';


export interface IAttribute {
    size: number;
    offset: number;
    name: string;
}

// temp solution
export type Uniforms = IMap<Uint8Array>;


export interface IEmitterPassDesc
{
    instanceName: string;
    instanceLayout: IAttribute[];
    
    geometry: string;
    sorting: boolean;
    stride: number; // number of float elements in the prerendered particle (src)

    // GLSL shader's sources
    vertexShader: string;
    pixelShader: string;
}

export interface IEmitterPass {
    getDesc(): IEmitterPassDesc;
    getData(): IMemory;
    getNumRenderedParticles(): number;  // num alive particles multipled by the prerendered instance count
    serialize(): void;                  // fill render buffer with instance data, including sorting if needed
    prerender(uniforms: Uniforms);      // update materials data per instance

    dump(): void;
}


export interface IEmitter {
    getName(): string;
    getCapacity(): number;
    getPassCount(): number;
    getPass(i: number): IEmitterPass;
    getNumParticles(): number;
    
    simulate(uniforms: Uniforms): void;
    prerender(uniforms: Uniforms): void;    // alias for all pass prerender ((pass of passes) pass.prerender())
    serialize(): void;                      // alias for all pass serialization ((pass of passes) pass.serialize())
    reset(): void;
    
    dump(): void;
}

