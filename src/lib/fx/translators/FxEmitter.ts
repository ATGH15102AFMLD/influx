import { isNull } from "@lib/common";
import { T_INT } from "@lib/fx/analisys/SystemScope";
import { EInstructionTypes, ICompileExprInstruction, IInstruction, IPresetInstruction, ITechniqueInstruction } from "@lib/idl/IInstruction";
import { ISLDocument } from "@lib/idl/ISLDocument";
import { IDrawStmtInstruction, IPartFxInstruction, IPartFxPassInstruction, ISpawnStmtInstruction } from "@lib/idl/part/IPartFx";

import { CodeConvolutionEmitter } from "./CodeConvolutionEmitter";
import { CodeEmitter, CodeReflection, ICodeEmitterOptions, IConvolutionPack } from "./CodeEmitter";


export class FxEmitter<CodeReflectionT extends CodeReflection> extends CodeConvolutionEmitter<CodeReflectionT> {
    // aux
    protected tech: ITechniqueInstruction;

    protected emitRoutineProperty(cref: CodeReflectionT, name: string, routine: ICompileExprInstruction) {
        this.emitKeyword(name);
        this.emitKeyword('=');
        this.emitSpace();
        this.emitCompile(cref, routine);
        this.emitChar(';');
        this.emitNewline();
    }


    protected emitStringProperty(cref: CodeReflectionT, name: string, id: string) {
        this.emitKeyword(name),
        this.emitKeyword('='),
        this.emitKeyword(id),
        this.emitChar(';'),
        this.emitNewline()
    }


    protected emitSpawnStmt(cref: CodeReflectionT, stmt: ISpawnStmtInstruction) {
        const fx = <IPartFxInstruction>this.tech;
        const init = stmt.scope.findFunction(stmt.name, [fx.particle, T_INT, ...stmt.args.map(a => a.type)]);
        
        if (cref.addFunction(init))
            this.emitFunction(cref, init);

        this.emitKeyword(`spawn(${stmt.count})`);
        this.emitKeyword(stmt.name);
        this.emitChar('(');
        this.emitNoSpace();
        stmt.args.forEach((arg, i, list) => {
            this.emitExpression(cref, arg);
            (i + 1 != list.length) && this.emitChar(',');
        });
        this.emitChar(')');
        this.emitChar(';');
    }


    protected emitDrawStmt(cref: CodeReflectionT, stmt: IDrawStmtInstruction) {
        
        this.emitKeyword(`draw`);
        this.emitKeyword(stmt.name);
        this.emitChar('(');
        this.emitNoSpace();
        stmt.args.forEach((arg, i, list) => {
            this.emitExpression(cref, arg);
            (i + 1 != list.length) && this.emitChar(',');
        });
        this.emitChar(')');
        this.emitChar(';');
    }


    emitPartFxDecl(cref: CodeReflectionT, fx: IPartFxInstruction) {
        this.tech = fx;

        this.begin();
        {
            this.emitKeyword('partFx');
            fx.name && this.emitKeyword(fx.name);
            fx.semantic && this.emitSemantic(cref, fx.semantic);
            fx.annotation && this.emitAnnotation(cref, fx.annotation);
            this.emitNewline();
            this.emitChar('{');
            this.push();
            {
                fx.capacity && this.emitStringProperty(cref, 'Capacity', String(fx.capacity));

                fx.spawnRoutine && this.emitRoutineProperty(cref, 'SpawnRoutine', fx.spawnRoutine);
                fx.initRoutine && this.emitRoutineProperty(cref, 'InitRoutine', fx.initRoutine);
                fx.updateRoutine && this.emitRoutineProperty(cref, 'UpdateRoutine', fx.updateRoutine);

                this.emitNewline();
                fx.passList.forEach((pass, i) => (this.emitPartFxPass(cref, pass),
                    i !== fx.passList.length - 1 && this.emitNewline()));
                this.emitNewline();
                fx.presets.forEach((preset, i) => (this.emitPresetDecl(cref, preset),
                    i !== fx.presets.length - 1 && this.emitNewline()));
            }
            this.pop();
            this.emitChar('}');
        }
        this.end();
    }


    emitTechniqueDecl(cref: CodeReflectionT, fx: ITechniqueInstruction) {
        this.tech = fx;
        this.begin();
        {
            this.emitKeyword('technique');
            fx.name && this.emitKeyword(fx.name);
            fx.semantic && this.emitSemantic(cref, fx.semantic);
            fx.annotation && this.emitAnnotation(cref, fx.annotation);
            this.emitNewline();
            this.emitChar('{');
            this.push();
            {
                this.emitNewline();
                fx.passList.forEach((pass, i) => (this.emitPass(cref, pass),
                    i !== fx.passList.length - 1 && this.emitNewline()));
            }
            this.pop();
            this.emitChar('}');
        }
        this.end();
    }


    emitPartFxPass(cref: CodeReflectionT, pass: IPartFxPassInstruction) {
        this.emitKeyword('pass');
        pass.name && this.emitKeyword(pass.name);
        this.emitNewline();
        this.emitChar('{');
        this.push();
        {
            pass.prerenderRoutine && this.emitRoutineProperty(cref, 'PrerenderRoutine', pass.prerenderRoutine);
            pass.sorting && this.emitStringProperty(cref, 'Sorting', String(pass.sorting));
            this.emitStringProperty(cref, 'Geometry', `"${pass.geometry}"`);
            pass.instanceCount !== 1 && this.emitStringProperty(cref, 'InstanceCount', String(pass.instanceCount));

            super.emitPassBody(cref, pass);
        }
        this.pop();
        this.emitChar('}');
        this.emitNewline();
    }


    emitPresetDecl(cref: CodeReflectionT, preset: IPresetInstruction) {
        this.emitKeyword('preset');
        preset.name && this.emitKeyword(preset.name);
        this.emitNewline();
        this.emitChar('{');
        this.push();
        {
            preset.props.forEach(prop => {
                this.emitKeyword(prop.id.name);
                this.emitKeyword('=');
                this.emitKeyword('{');
                this.emitExpressionList(cref, prop.args);
                this.emitKeyword('}');
                this.emitChar(';');
                this.emitNewline();
            });
        }
        this.pop();
        this.emitChar('}');
        this.emitNewline();
    }


    emitStmt(cref: CodeReflectionT, stmt: IInstruction) {
        switch (stmt.instructionType) {
            case EInstructionTypes.k_SpawnStmt:
                this.emitSpawnStmt(cref, stmt as ISpawnStmtInstruction);
                break;
            case EInstructionTypes.k_DrawStmt:
                this.emitDrawStmt(cref, stmt as IDrawStmtInstruction);
                break;
            default:
                super.emitStmt(cref, stmt);
        }
    }


    emit(cref: CodeReflectionT, instr: IInstruction): FxEmitter<CodeReflectionT> {
        if (!instr) {
            return this;
        }

        switch (instr.instructionType) {
            case EInstructionTypes.k_PartFxDecl:
                this.emitPartFxDecl(cref, instr as IPartFxInstruction);
                break;
            case EInstructionTypes.k_TechniqueDecl:
                this.emitTechniqueDecl(cref, instr as ITechniqueInstruction);
                break;
            default:
                super.emit(cref, instr)
        }

        return this;
    }
}

export function translate(instr: IInstruction, opts?: ICodeEmitterOptions): string {
    const emitter = new FxEmitter(null, null, opts);
    const cref = new CodeReflection;
    emitter.emit(cref, instr);
    return emitter.toString();
}

export function translateConvolute(instr: IInstruction, { textDocument, slastDocument }: IConvolutionPack, opts?: ICodeEmitterOptions): string {
    const emitter = new FxEmitter(textDocument, slastDocument, opts);
    const cref = new CodeReflection;
    emitter.emit(cref, instr);
    return emitter.toString();
}

export function translateDocument(document: ISLDocument): string {
    if (isNull(document)) {
        return '';
    }

    if (isNull(document.root)) {
        return '';
    }

    return translate(document.root);
}

export function translateTechnique(document: ISLDocument, techName: string): string {
    if (isNull(document)) {
        return '';
    }

    if (isNull(document.root)) {
        return '';
    }

    return translate(document.root.scope.findTechnique(techName));
}


