
import { assert, isDef, isDefAndNotNull } from "@lib/common";
import Callstack from "@lib/fx/bytecode/Callstack";
import { REG_INVALID } from "@lib/fx/bytecode/common";
import ConstanPool from "@lib/fx/bytecode/ConstantPool";
import debugLayout, { CdlRaw } from "@lib/fx/bytecode/DebugLayout";
import InstructionList from "@lib/fx/bytecode/InstructionList";
import sizeof from "@lib/fx/bytecode/sizeof";
import { DeclStmtInstruction } from "@lib/fx/instructions/DeclStmtInstruction";
import { ExprInstruction } from "@lib/fx/instructions/ExprInstruction";
import { Instruction } from "@lib/fx/instructions/Instruction";
import { ReturnStmtInstruction } from "@lib/fx/instructions/ReturnStmtInstruction";
import { VariableDeclInstruction } from "@lib/fx/instructions/VariableDeclInstruction";
import * as SystemScope from "@lib/fx/SystemScope";
import { T_FLOAT, T_INT } from "@lib/fx/SystemScope";
import { EChunkType, EMemoryLocation } from "@lib/idl/bytecode";
import { EOperation } from "@lib/idl/bytecode/EOperations";
import { EInstructionTypes, IArithmeticExprInstruction, IAssignmentExprInstruction, ICastExprInstruction, IComplexExprInstruction, IConstructorCallInstruction, IExprInstruction, IExprStmtInstruction, IFunctionCallInstruction, IFunctionDeclInstruction, IIdExprInstruction, IInitExprInstruction, IInstruction, ILiteralInstruction, IPostfixPointInstruction, IScope, IStmtBlockInstruction, IVariableDeclInstruction } from "@lib/idl/IInstruction";
import { IRange } from "@lib/idl/parser/IParser";
import { Diagnostics } from "@lib/util/Diagnostics";
import { isNull, isString } from "util";


enum EErrors {
    k_UnsupportedConstantType,
    k_UnsupportedExprType,
    k_UnsupoortedTypeConversion,
    k_UnsupportedArithmeticExpr
}

// FIXME: don't use 'any' type
type ITranslatorDiagDesc = any;

class TranslatorDiagnostics extends Diagnostics<ITranslatorDiagDesc> {
    constructor() {
        super("Translator Diagnostics", 'T');
    }

    protected resolveFilename(code: number, desc: ITranslatorDiagDesc): string {
        return '[unknown]';  // FIXME: return correct filename
    }

    protected resolveRange(code: number, desc: ITranslatorDiagDesc): IRange {
        return { start: { line: 0, column: 0, file: null }, end: { line: 0, column: 0, file: null } }; // todo: fixme
    }

    protected diagnosticMessages() {
        return {};
    }
}


// class PromisedLocation {
//     size: number;
//     expr: IExprInstruction;
    
//     status: 'loaded' | 'unloaded';

//     constructor(expr: IExprInstruction) {

//     }
// }


// symbol name id generation;
const sname = {
    i32: (i32: number) => `%i32:${i32}`,
    f32: (f32: number) => `%f32:${f32}`,
    var: (vdecl: IVariableDeclInstruction) => `${vdecl.name}:${vdecl.instructionID}`,
    fun: (fdecl: IFunctionDeclInstruction) => `${fdecl.name}:${fdecl.instructionID}`,

    addr: (addr: number) => sname.i32(addr)
};



function ContextBuilder() {
    const diag = new TranslatorDiagnostics; // todo: remove it?
    const constants = new ConstanPool;
    const instructions = new InstructionList;
    // program counter: return current index of instruction 
    // (each instruction consists of 4th numbers)
    const pc = () => instructions.pc;

    const debug = debugLayout(pc);
    const callstack = new Callstack(instructions);

    return {
        diag,
        callstack,
        constants,
        instructions,
        debug,
        pc
    }
}

type Context = ReturnType<typeof ContextBuilder>;


export interface ISubProgram {
    code: Uint8Array;
    constants: ConstanPool;
    cdl: CdlRaw;
}

function translateSubProgram(ctx: Context, fn: IFunctionDeclInstruction): ISubProgram {
    const { diag, callstack, constants, instructions, debug } = ctx;

    // NOTE: it does nothing at the momemt :/
    debug.beginCompilationUnit('[todo]');

    // simulate function call()
    callstack.push(fn);
    translateFunction(ctx, fn);
    callstack.pop();
    debug.endCompilationUnit();


    function constChunk(): ArrayBuffer {
        const mem = constants.data;
        const size = mem.byteLength >> 2;
        const chunkHeader = [EChunkType.k_Constants, size];
        assert((size << 2) == mem.byteLength);
        const data = new Uint32Array(chunkHeader.length + size);
        data.set(chunkHeader);
        data.set(new Uint32Array(mem.byteArray, 0, mem.byteLength >> 2), chunkHeader.length);
        return data.buffer;
    }


    function codeChunk(): ArrayBuffer {
        const chunkHeader = [EChunkType.k_Code, instructions.length];
        const data = new Uint32Array(chunkHeader.length + instructions.length);
        data.set(chunkHeader);
        data.set(instructions.data, chunkHeader.length);

        return data.buffer;
    }

    function binary(): Uint8Array {
        const chunks = [constChunk(), codeChunk()].map(ch => new Uint8Array(ch));
        const byteLength = chunks.map(x => x.byteLength).reduce((a, b) => a + b);
        let data = new Uint8Array(byteLength);
        let offset = 0;
        chunks.forEach(ch => {
            data.set(ch, offset);
            offset += ch.byteLength;
        });
        return data;
    }

    let code = binary();         // todo: stay only binary view
    let cdl = debug.dump();      // code debug layout;

    return { code, constants, cdl };
}

function translateFunction(ctx: Context, func: IFunctionDeclInstruction) {
    const { diag, callstack, constants, instructions, debug, pc } = ctx;

    // NOTE: pc - number of written instructions
    // NOTE: rc - number of occupied registers

    // shortcuts for ref/deref
    const deref = (sname: string) => callstack.deref(sname);
    const ref = (sname: string, r: number) => callstack.ref(sname, r);
    const cderef = (sname: string) => callstack.cderef(sname);
    const cref = (sname: string, r: number) => callstack.cref(sname, r);
    const alloca = (size: number) => callstack.alloca(size);

    /** resolve constant (all constants have been placed in global memory) */
    function rconst(lit: ILiteralInstruction): number {
        switch (lit.instructionType) {
            // assume only int32
            case EInstructionTypes.k_IntInstruction:
                {
                    let i32 = <number>(lit as ILiteralInstruction).value;
                    let r = cderef(sname.i32(i32));
                    if (r == REG_INVALID) {
                        r = alloca(sizeof.i32());
                        // constants.checkInt32(i32) => returns address in global memory
                        icode(EOperation.k_I32LoadConst, r, constants.checkInt32(i32));
                        debug.map(lit);

                        cref(sname.i32(i32), r);
                    }
                    return r;
                }
                break;
            case EInstructionTypes.k_FloatInstruction:
                {
                    let f32 = <number>(lit as ILiteralInstruction).value;
                    let r = cderef(sname.f32(f32));
                    if (r == REG_INVALID) {
                        r = alloca(sizeof.f32());
                        icode(EOperation.k_I32LoadConst, r, constants.checkFloat32(f32));
                        debug.map(lit);

                        cref(sname.f32(f32), r);
                    }
                    return r;
                }
                break;
            case EInstructionTypes.k_BoolInstruction:
                {
                    let i32 = (<number>(lit as ILiteralInstruction).value) ? 1 : 0;
                    let r = cderef(sname.i32(i32));
                    if (r == REG_INVALID) {
                        r = alloca(sizeof.i32());
                        icode(EOperation.k_I32LoadConst, r, constants.checkInt32(i32));
                        debug.map(lit);

                        cref(sname.i32(i32), r);
                    }
                    return r;
                }
                break;
            default:
                diag.critical(EErrors.k_UnsupportedConstantType, {});
        }

        return REG_INVALID;
    }


    // function rconst_addr(addr: number): number {
    //     let r = deref(sname.addr(addr));
    //     if (r == REG_INVALID) {
    //         r = alloca(sizeof.addr());
    //         icode(EOperation.k_I32LoadConst, r, constants.checkAddr(addr));
    //         ref(sname.addr(addr), r);
    //     }
    //     return r;
    // }



    /** insert code */
    function icode(code: EOperation, ...args: number[]): void {
        if (code === EOperation.k_Ret) {
            // add the instruction address to the description of the
            // function on the top of the colstack; when the code
            // generation for this function is completed, all return
            // instructions must receive the correct addresses for
            // jumping to the end of the function
            callstack.addReturn();
        }
        // add this instruction to debug layout;
        debug.step();
        instructions.add(code, args);
    }

    interface FnSwizzle {
        (i: number): number;
    }

    // move from register to register
    function imove(dest: number, src: number, size: number,
        destSwizzle?: FnSwizzle, srcSwizzle?: FnSwizzle): void {
        destSwizzle = destSwizzle || (i => i);
        srcSwizzle = srcSwizzle || (i => i);
        assert(size % sizeof.i32() === 0, 'Per byte/bit loading is not supported.');
        for (let i = 0, n = size / sizeof.i32(); i < n; ++i) {
            icode(EOperation.k_I32MoveRegToReg, dest + destSwizzle(i) * sizeof.i32(), src + srcSwizzle(i) * sizeof.i32());
        }
    }


    // move from input to registers
    function iload(inputIndex: number, dest: number, src: number, size: number,
        destSwizzle?: FnSwizzle, srcSwizzle?: FnSwizzle): void {
        destSwizzle = destSwizzle || (i => i);
        srcSwizzle = srcSwizzle || (i => i);
        assert(size % sizeof.i32() === 0, 'Per byte/bit loading is not supported.');
        for (let i = 0, n = size / sizeof.i32(); i < n; ++i) {
            icode(EOperation.k_I32LoadInput, inputIndex, dest + destSwizzle(i) * sizeof.i32(), src + srcSwizzle(i) * sizeof.i32());
        }
    }


    // move from registers to input
    function istore(inputIndex: number, dest: number, src: number, size: number,
        destSwizzle?: FnSwizzle, srcSwizzle?: FnSwizzle): void {
        destSwizzle = destSwizzle || (i => i);
        srcSwizzle = srcSwizzle || (i => i);
        assert(size % sizeof.i32() === 0, 'Per byte/bit loading is not supported.');
        for (let i = 0, n = size / sizeof.i32(); i < n; ++i) {
            icode(EOperation.k_I32StoreInput, inputIndex, dest + destSwizzle(i) * sizeof.i32(), src + srcSwizzle(i) * sizeof.i32());
        }
    }


    function load(expr: IExprInstruction, size: number = 0, padding: number = 0,
        destSwizzle?: FnSwizzle, srcSwizzle?: FnSwizzle) {
        const decl = ExprInstruction.UnwindExpr(expr);
        assert(determMemoryLocation(decl) != EMemoryLocation.k_Registers);

        size = size || decl.type.size;

        if (decl.isParameter()) {
            if (callstack.isEntryPoint()) {
                // implies that each parameter is loaded from its stream, so 
                // the offset is always zero. 
                // Otherwise use 'VariableDeclInstruction.getParameterOffset(decl);'
                // in order to determ correct offset between parameters
                const offset = 0;
                const dest = alloca(size);
                const src = offset + padding;
                const inputIndex = VariableDeclInstruction.getParameterIndex(decl);
                iload(inputIndex, dest, src, size, destSwizzle, srcSwizzle);
                debug.map(expr);
                return dest;
            } else {
                assert(false, 'unsupported');
            }
        }

        if (decl.isGlobal()) {
            assert(false, 'unsupported');
        }

        assert(false, "all is bad :/");
        return 0;
    }


    function determMemoryLocation(decl: IVariableDeclInstruction): EMemoryLocation {
        if (decl.isParameter()) {
            if (decl.type.hasUsage('out') || decl.type.hasUsage('inout')) {
                // entry point function can refer to input memory, for ex. vertex shader
                return callstack.isEntryPoint() ? EMemoryLocation.k_Input : EMemoryLocation.k_Registers;
            }
        }

        if (decl.isGlobal()) {
            assert(false, 'unsupported');
        }

        assert(decl.isLocal());
        return EMemoryLocation.k_Registers;
    }


    /** Universal memcopy() suitable both for registers and external memory */
    function store(expr: IExprInstruction, dest: number, src: number, size: number) {
        const decl = ExprInstruction.UnwindExpr(expr);
        assert(!isNull(decl), 'declaration cannot be null');

        let offset = 0;
        if (decl.isParameter()) {
            // implies that each parameter is loaded from its stream, so 
            // the offset is always zero. 
            // Otherwise use 'VariableDeclInstruction.getParameterOffset(decl);'
            // in order to determ correct offset between parameters
            offset = 0;
        }

        dest += offset;

        switch (determMemoryLocation(decl)) {
            case EMemoryLocation.k_Input:
                const inputIndex = VariableDeclInstruction.getParameterIndex(decl);
                istore(inputIndex, dest, src, size);
                break;
            case EMemoryLocation.k_Registers:
            default:
                imove(dest, src, size);
        }
    }

    /** determines if the expression is in external memory or not  */
    function isLoadRequired(expr: IExprInstruction): boolean {
        const decl = ExprInstruction.UnwindExpr(expr);
        assert(!isNull(decl), 'declaration cannot be null');
        return determMemoryLocation(decl) != EMemoryLocation.k_Registers;
    }

    const POSTFIX_COMPONENT_MAP = {
        'r': 0, 'x': 0, 's': 0,
        'g': 1, 'y': 1, 't': 1,
        'b': 2, 'z': 2, 'p': 2,
        'a': 3, 'w': 3, 'q': 3
    };

    function isValidPostfixNameForSwizzling(postfixName: string): boolean {
        return postfixName
            .split('')
            .map(c => POSTFIX_COMPONENT_MAP[c])
            .map(i => i >= 0 && i < 4)
            .reduce((accum, val) => accum && val);
    }

    // xxwy => [0, 0, 3, 1]
    function makeSwizzlePattern(postfixName: string): number[] {
        return postfixName.split('').map(c => POSTFIX_COMPONENT_MAP[c]);
    }


    /** resolve address => returns address of temprary result of expression */
    function raddr(expr: IExprInstruction, isLoadAllowed: boolean = true): number {
        switch (expr.instructionType) {
            case EInstructionTypes.k_InitExprInstruction:
                {
                    const init = expr as IInitExprInstruction;

                    if (init.isArray()) {
                        diag.critical(EErrors.k_UnsupportedExprType, {});
                    }

                    let arg = init.arguments[0];
                    return raddr(arg);
                }
                break;
            case EInstructionTypes.k_BoolInstruction:
            case EInstructionTypes.k_IntInstruction:
            case EInstructionTypes.k_FloatInstruction:
                return rconst(expr as ILiteralInstruction);
            case EInstructionTypes.k_IdExprInstruction:
                {
                    let id = (expr as IIdExprInstruction);
                    assert(id.declaration === ExprInstruction.UnwindExpr(id));

                    if (isLoadRequired(id)) {
                        if (isLoadAllowed) {
                            return load(id);
                        }
                        return 0;
                    }

                    // todo: add register based parameters support

                    return deref(sname.var(id.declaration as IVariableDeclInstruction));
                }
            case EInstructionTypes.k_ComplexExprInstruction:
                return raddr((expr as IComplexExprInstruction).expr);
            case EInstructionTypes.k_ArithmeticExprInstruction:
                {
                    const arithExpr = expr as IArithmeticExprInstruction;

                    const opIntMap = {
                        '+': EOperation.k_I32Add,
                        '-': EOperation.k_I32Sub,
                        '*': EOperation.k_I32Mul,
                        '/': EOperation.k_I32Div
                    }

                    const opFloatMap = {
                        '+': EOperation.k_F32Add,
                        '-': EOperation.k_F32Sub,
                        '*': EOperation.k_F32Mul,
                        '/': EOperation.k_F32Div
                    }

                    let op: EOperation;

                    if (arithExpr.type.isEqual(T_INT)) {
                        op = opIntMap[arithExpr.operator];
                    } else if (arithExpr.type.isEqual(T_FLOAT)) {
                        op = opFloatMap[arithExpr.operator];
                    } else {
                        // todo: add type description
                        diag.critical(EErrors.k_UnsupportedArithmeticExpr, {});
                    }

                    if (!isDef(op)) {
                        diag.critical(EErrors.k_UnsupportedExprType, {});
                        return REG_INVALID;
                    }

                    const dest = alloca(arithExpr.type.size);
                    icode(op, dest, raddr(arithExpr.left), raddr(arithExpr.right));
                    debug.map(arithExpr);
                    debug.ns();
                    return dest;
                }
                break;
            case EInstructionTypes.k_CastExprInstruction:
                {
                    const castExpr = expr as ICastExprInstruction;

                    if (castExpr.isUseless()) {
                        console.warn(`Useless cast found: ${castExpr.toCode()}`);
                        return raddr(castExpr.expr, isLoadAllowed);
                    }

                    const srcType = castExpr.expr.type;
                    const dstType = castExpr.type;

                    let op: EOperation;
                    if (srcType.isEqual(T_FLOAT) && dstType.isEqual(T_INT)) {
                        op = EOperation.k_F32ToI32;
                    } else if (srcType.isEqual(T_INT) && dstType.isEqual(T_FLOAT)) {
                        op = EOperation.k_I32ToF32;
                    } else {
                        // todo: add type descriptions
                        diag.critical(EErrors.k_UnsupoortedTypeConversion, {});
                        return REG_INVALID;
                    }

                    const dest = alloca(castExpr.type.size);
                    icode(op, dest, raddr(castExpr.expr));
                    debug.map(castExpr);
                    return dest;
                }
                break;
            case EInstructionTypes.k_PostfixPointInstruction:
                {
                    const point = expr as IPostfixPointInstruction;
                    const { element, postfix } = point;
                    const elementAddr = raddr(element, false);

                    let { size, padding } = postfix.type;

                    let srcSwizzle = i => i;

                    // Does expression have dynamic indexing?
                    // todo: rename isConstExpr() method to something more suitable
                    if (point.isConstExpr()) {

                        // handle such types like float2, float3, int2, int3 etc.
                        // all system types except matrix and samplers support swizzling
                        const isSwizzlingSupported = SystemScope.isVectorType(element.type) ||
                            SystemScope.isScalarType(element.type);

                        if (isSwizzlingSupported) {
                            assert(isValidPostfixNameForSwizzling(postfix.name));
                            const swizzlingPattern = makeSwizzlePattern(postfix.name);
                            srcSwizzle = i => swizzlingPattern[i];

                            assert(padding === Instruction.UNDEFINE_PADDING, 'padding of swizzled components must be undefined');
                            padding = 0;
                        }

                        // If loading not allowed then we are inside the recursive call to calculate the final address
                        // so in this case we just have to return address with padding added to it.
                        if (isLoadAllowed) {
                            // check loading from input
                            if (isLoadRequired(element)) {
                                return load(element, size, padding, null, srcSwizzle);
                            }

                            // preload swizzled pattern
                            if (srcSwizzle) {
                                const dest = alloca(size);
                                const src = elementAddr;
                                imove(dest, src, size, null, srcSwizzle);
                            }
                        }

                        return elementAddr + padding;
                    }

                    assert(false, 'not implemented!');

                    // todo: add support for move_reg_ptr, move_ptr_ptr, move_ptr_reg
                    // if (padding > 0) {
                    //     const postfixReg = rconst_addr(padding);     // write element's padding to register
                    //     const elementReg = rconst_addr(elementAddr); // write element's addr to register
                    //     const destReg = alloca(sizeof.addr());
                    //     icode(EOperation.k_I32Add, destReg, elementReg, postfixReg);
                    //     debug.map(point);
                    //     return destReg; // << !!!! return addr!!!
                    // }

                    return elementAddr;
                }
                break;
            case EInstructionTypes.k_FunctionCallInstruction:
                {
                    const call = expr as IFunctionCallInstruction;
                    const fdecl = call.declaration as IFunctionDeclInstruction;

                    const ret = callstack.push(fdecl);

                    for (let i = 0; i < fdecl.definition.paramList.length; ++i) {
                        const param = fdecl.definition.paramList[i];
                        const arg = i < call.args.length ? call.args[i] : null;

                        const src = !isNull(arg) ? raddr(arg, false) : raddr(param.initExpr);

                        // by default all parameters are interpreted as 'in'
                        if (param.type.hasUsage('out') || param.type.hasUsage('inout')) {
                            ref(sname.var(param), src);
                        } else {
                            // todo: handle expressions like "float4 v = 5.0;"
                            const size = param.type.size;
                            const dest = alloca(param.type.size);
                            imove(dest, src, size);
                            // debug.map(param);

                            ref(sname.var(param), dest);
                        }
                    }

                    translateFunction(ctx, fdecl);
                    callstack.pop();

                    return ret;
                }
                break;
            case EInstructionTypes.k_ConstructorCallInstruction:
                {
                    const ctorCall = expr as IConstructorCallInstruction;
                    // todo: add correct constructor call support for builtin type at the level of analyzer
                    const type = ctorCall.type;
                    const args = (ctorCall.arguments as IExprInstruction[]);

                    const dest = alloca(type.size);

                    switch (type.name) {
                        case 'float':
                        case 'float1':
                        case 'float2':
                        case 'float3':
                        case 'float4':
                            switch (args.length) {
                                case 1:
                                    // todo: convert float to int if necessary
                                    // handling for the case single same type argument and multiple floats
                                    assert(Instruction.isExpression(args[0]));
                                    const src = raddr(args[0]);
                                    // return always zero in case of float4(1.0) for ex. => always copy from zero register
                                    const fnSourceSwizzle = (i: number) => type.size === args[0].type.size ? i : 0;
                                    imove(dest, src, type.size, null, fnSourceSwizzle);
                                    break;
                                default:
                                    let offset = 0;
                                    for (let i = 0; i < args.length; ++i) {
                                        assert(Instruction.isExpression(args[i]));
                                        imove(dest + offset, raddr(args[i]), args[i].type.size);
                                        offset += args[i].type.size;
                                    }
                                    break;

                            }
                            return dest;
                            break;
                        default:
                    }
                    console.warn(`Unknown constructor found: ${ctorCall.toCode()}`);
                    return REG_INVALID;
                }
                break;
            default:
                console.warn(`Unknown expression found: ${EInstructionTypes[expr.instructionType]}`);
                return REG_INVALID;
        }
    }




    // 
    // Handle all instruction types
    //

    function translate(instr: IInstruction) {
        if (isNull(instr)) {
            return;
        }

        switch (instr.instructionType) {
            case EInstructionTypes.k_VariableDeclInstruction:
                {
                    let decl = instr as IVariableDeclInstruction;

                    if (isNull(decl.initExpr)) {
                        // There is no initial value, but allocation should be done anyway
                        // in order to assign register for this variable.
                        ref(sname.var(decl), alloca(decl.type.size));
                        return;
                    }

                    /*
                    0: int a = 1;           | 0x00: load %a   #1        | NS 0
                    1: int b = 2;           | 0x01: load %b   #2        | NS 1
                    2: int c = a + b * 10;  | 0x02: load %t0  #10       |
                                            | 0x03: mul  $t1  %b %t0    |
                                            | 0x02: add  %c   %a %t1    | NS 2
                    3: return c;            | 0x03: move %rax %c        | NS 3
                                            | 0x04: ret                 |
                                            |
                    */

                    ref(sname.var(decl), raddr(decl.initExpr));
                    debug.ns();
                    return;
                }
            case EInstructionTypes.k_DeclStmtInstruction:
                {
                    let stmt = instr as DeclStmtInstruction;
                    for (let decl of stmt.declList) {
                        translate(decl);
                    }
                    return;
                }
            case EInstructionTypes.k_ReturnStmtInstruction:
                {
                    let ret = instr as ReturnStmtInstruction;
                    if (!isNull(ret.expr)) {
                        // move correct size!
                        const size = ret.expr.type.size;
                        const src = raddr(ret.expr);
                        const dest = callstack.ret;
                        imove(dest, src, size);
                        debug.map(ret.expr);
                        debug.ns();

                        icode(EOperation.k_Ret);
                        debug.map(ret);
                    }
                    return;
                }
            case EInstructionTypes.k_StmtBlockInstruction:
                {
                    let block = instr as IStmtBlockInstruction;
                    for (let stmt of block.stmtList) {
                        translate(stmt);
                    }
                    return;
                }
            case EInstructionTypes.k_FunctionDeclInstruction:
                {
                    let func = instr as IFunctionDeclInstruction;
                    let def = func.definition; // todo: handle all arguments!!
                    let impl = func.implementation;

                    translate(impl);

                    return;
                }
            case EInstructionTypes.k_ExprStmtInstruction:
                {
                    let stmt = instr as IExprStmtInstruction;
                    translate(stmt.expr);
                    return;
                }
            case EInstructionTypes.k_AssignmentExprInstruction:
                {
                    const assigment = instr as IAssignmentExprInstruction;
                    const size = assigment.type.size;
                    assert(size % sizeof.i32() === 0);
                    assert(assigment.operator === '=');

                    // left address can be both from the registers and in the external memory
                    const leftAddr = raddr(assigment.left, false);

                    assert(Instruction.isExpression(assigment.right));
                    // right address always from the registers
                    const rightAddr = raddr(<IExprInstruction>assigment.right);

                    store(assigment.left, leftAddr, rightAddr, size);

                    debug.map(assigment);
                    debug.ns();
                    return;
                }
            default:
                console.warn(`Unknown statement found: ${EInstructionTypes[instr.instructionType]}`);
        }
    }

    translate(func);
}


const hex2 = (v: number) => `0x${v.toString(16).padStart(2, '0')}`;
const hex4 = (v: number) => `0x${v.toString(16).padStart(4, '0')}`;
// const reg = (v: number) => REG_NAMES[v] || `[${hex2(v >>> 0)}]`;    // register address;
// const addr = (v: number) => `%${hex4(v >>> 0)}%`;                   // global memory address;


export function translate(entryFunc: IFunctionDeclInstruction): ISubProgram;
export function translate(entryPoint: string, scope: IScope): ISubProgram;
export function translate(...argv): ISubProgram {
    let func: IFunctionDeclInstruction;
    if (isString(argv[0])) {
        let fname = argv[0];
        let scope = argv[1];
        func = scope.findFunction(fname, null);
    } else {
        func = argv[0];
    }

    let ctx = ContextBuilder();
    let res: ISubProgram = null;

    try {
        if (!isDefAndNotNull(func)) {
            console.error(`Entry point '${func.name}' not found.`);
            return null;
        }
        res = translateSubProgram(ctx, func);
    } catch (e) {
        throw e;
        console.error(TranslatorDiagnostics.stringify(ctx.diag.resolve()));
    }

    return res;
}