import { ISubProgram } from '@lib/fx/bytecode/Bytecode';
import { IMap } from '@lib/idl/IMap';
import { ISLASTDocument } from '@lib/idl/ISLASTDocument';
import { ISLDocument } from '@lib/idl/ISLDocument';
import { EParserType, IParserParams, IRange } from '@lib/idl/parser/IParser';
import { RouterState } from 'connected-react-router';
import { ITextDocument } from '@lib/idl/ITextDocument';
import { LGraph } from 'litegraph.js';
import { ITimeline } from '@lib/fx/timeline';
import * as S3D from '@lib/util/s3d/prjenv';
import { ITechnique } from '@lib/idl/ITechnique';

export interface IMarker {
    range: IRange;
    type: 'warning' | 'error' | 'marker' | 'line' | 'unreachable-code';
    tooltip?: string;
    payload?: Object;
}

export interface IDebuggerState {
    options: {
        colorize: boolean;
        disableOptimizations: boolean;
        autocompile: boolean;
        wasm: boolean;
    };

    expression: string;

    // (current debugger runtime)
    // BytecodeView shows instructions
    // with additional debug info, like colorization using
    // cdl view.
    runtime: ISubProgram;
}


export interface IFileState {
    uri: string;                    // source file's path
    content: string;                // source file's content

    revision: number;               // number of updates of file

    error: Error;                   // source file loading's error

    slastDocument: ISLASTDocument;
    slDocument: ISLDocument;
    rawDocument: ITextDocument;

    markers: IMap<IMarker>;
    breakpoints: number[];

    debugger: IDebuggerState;

    defines: string[];
}

export interface INodeConstant {
    name: string;
    value: string;
    type: string;
}

export interface INodePipeline {
    docs: string;               // current info of selected node
    graph: LGraph;
    revision: number;          // number of updates of graph
    env: ISLDocument;          // library extended with particle struct
    constants: INodeConstant[];
    capacity: number;
}


export interface IPlaygroundControlProps {
    min?: number;
    max?: number;
    step?: number;
    type: string;
    name?: string;
    value?: Vector3 | Color | Number;
}

export type Color = { r: number; g: number; b: number; a: number };
export type Vector3 = { x: number; y: number; z: number };
export type Vector4 = { x: number; y: number; z: number; w: number };
export type ControlValue = Vector3 | Vector4 | Color | Number;
export type ControlValues = IMap<ControlValue>;

export interface IPlaygroundPresetEntry {
    name: string;
    value: Uint8Array;
}

export interface IPlaygroundPreset {
    name: string;
    desc: string;
    data: IPlaygroundPresetEntry[];
}

export interface IPlaygroundControls {
    values: ControlValues;
    props: IMap<IPlaygroundControlProps>;
    presets: IPlaygroundPreset[];
}



type PlaygroundPresets = IMap<ControlValues>;

export interface IPlaygroundState {
    technique: ITechnique;
    timeline: ITimeline;
    controls: IPlaygroundControls;
    presets: PlaygroundPresets;
    revision: number;               // number of updates of emitter
    wasm: boolean;                  // technique's backend mode
    shaderFormat: 'glsl' | 'hlsl';

    exportName: string;             // path on user disk (last 'save as' path)
    autosave: boolean;              // save file to disk on every change
}

export interface IParserState extends IParserParams {
    filename: string;
    grammar: string;
    type: EParserType;
    // TODO: rename option (or move it out of this scope)
    parsingFlags: number;
}


export interface ITranslatorParams {
    uiControlsGatherToDedicatedConstantBuffer: boolean;
    uiControlsConstantBufferRegister: number;

    globalUniformsGatherToDedicatedConstantBuffer: boolean;
    globalUniformsConstantBufferRegister: number;
}

/*
Case Handling: " insensitive\r"
Client address: " 192.168.41.74\r"
Client host: " ipopov\r"
Client name: " ipopov_\r"
Client root: " C"
Client stream: " //dev/main_ProgrammerNoArt\r"
Current directory: " c"
Peer address: " 172.16.166.10"
Proxy address: " p4.saber3d.net"
Proxy version: " P4P/LINUX26X86_64/2020.2/2179691 (2021/09/02)\r"
Server date: " 2022/07/14 23"
Server license: " Licensed\r"
Server services: " standard\r"
Server version: " P4D/LINUX26X86_64/2020.2/2179691 (2021/09/02)\r"
ServerID: " p4_main_commit\r"
User name: " ivan.popov\r"
*/

export interface IP4Info {
    "Case Handling": string;
    "Client address": string;
    "Client host": string;
    "Client name": string;
    "Client root": string;
    "Client stream": string;
    "Current directory": string;
    "Peer address": string;
    "Proxy address": string;
    "Proxy version": string;
    "Server date": string;
    "Server license": string;
    "Server services": string;
    "Server version": string;
    "ServerID": string;
    "User name": string;
}

export interface IS3DState {
    env: S3D.ProjectEnv,
    p4: IP4Info
}

//
//
//

export interface IDepotFolder {
    path: string;
    folders?: IDepotFolder[];
    files?: string[];
    totalFiles: number;
}

export interface IDepot {
    root: IDepotFolder;
}

//
//
//

export interface IStoreState {
    readonly sourceFile: IFileState;
    readonly parserParams: IParserState;
    readonly translatorParams: ITranslatorParams;
    readonly router: RouterState;
    readonly playground: IPlaygroundState;
    readonly nodes: INodePipeline;
    readonly s3d: IS3DState;
    readonly depot: IDepot;
}

export default IStoreState;
