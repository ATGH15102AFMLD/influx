import { assert, isNull } from "@lib/common";
import { EInstructionTypes, ICompileExprInstruction, IFunctionDeclInstruction, IInstruction, ITypeInstruction } from "@lib/idl/IInstruction";
import { IMap } from "@lib/idl/IMap";
import { ISLDocument } from "@lib/idl/ISLDocument";
import { IPartFxInstruction, IPartFxPassInstruction, ISpawnStmtInstruction } from "@lib/idl/part/IPartFx";

import { CodeEmitter } from "./CodeEmitter";

export class FxEmitter extends CodeEmitter {
    static translateDocument(doc: ISLDocument): any {
        throw new Error('Method not implemented.');
    }

    protected emitRoutineProperty(name: string, routine: ICompileExprInstruction) {
        this.emitKeyword(name);
        this.emitKeyword('=');
        this.emitSpace();
        this.emitCompile(routine);
        this.emitChar(';');
        this.emitNewline();
    }

    protected emitStringProperty(name: string, id: string) {
        this.emitKeyword(name),
        this.emitKeyword('='),
        this.emitKeyword(id),
        this.emitChar(';'),
        this.emitNewline()
    }

    protected emitSpawnStmt(stmt: ISpawnStmtInstruction) {
        
        this.emitFunction(stmt.init);

        this.emitKeyword(`spawn(${stmt.count})`);
        this.emitKeyword(stmt.name);
        this.emitChar('(');
        this.emitNoSpace();
        stmt.args.forEach((arg, i, list) => {
            this.emitExpression(arg);
            (i + 1 != list.length) && this.emitChar(',');
        });
        this.emitChar(')');
        this.emitChar(';');
    }

    emitPartFxDecl(fx: IPartFxInstruction) {
        this.begin();
        {
            this.emitKeyword('partFx');
            fx.name && this.emitKeyword(fx.name);
            fx.semantic && this.emitSemantic(fx.semantic);
            fx.annotation && this.emitAnnotation(fx.annotation);
            this.emitNewline();
            this.emitChar('{');
            this.push();
            {
                fx.capacity && this.emitStringProperty('Capacity', String(fx.capacity));

                fx.spawnRoutine && this.emitRoutineProperty('SpawnRoutine', fx.spawnRoutine);
                fx.initRoutine && this.emitRoutineProperty('InitRoutine', fx.initRoutine);
                fx.updateRoutine && this.emitRoutineProperty('UpdateRoutine', fx.updateRoutine);

                this.emitNewline();
                fx.passList.forEach((pass, i) => (this.emitPartFxPass(pass),
                    i !== fx.passList.length - 1 && this.emitNewline()));
            }
            this.pop();
            this.emitChar('}');
        }
        this.end();
    }


    emitPartFxPass(pass: IPartFxPassInstruction) {
        this.emitKeyword('pass');
        pass.name && this.emitKeyword(pass.name);
        this.emitNewline();
        this.emitChar('{');
        this.push();
        {
            pass.prerenderRoutine && this.emitRoutineProperty('PrerenderRoutine', pass.prerenderRoutine);
            pass.sorting && this.emitStringProperty('Sorting', String(pass.sorting));
            this.emitStringProperty('Geometry', `"${pass.geometry}"`);
            pass.instanceCount !== 1 && this.emitStringProperty('InstanceCount', String(pass.instanceCount));

            super.emitPassBody(pass);
        }
        this.pop();
        this.emitChar('}');
        this.emitNewline();
    }


    emitStmt(stmt: IInstruction) {
        switch (stmt.instructionType) {
            case EInstructionTypes.k_SpawnStmt:
                this.emitSpawnStmt(stmt as ISpawnStmtInstruction);
                break;
            default:
                super.emitStmt(stmt);
        }
    }


    emit(instr: IInstruction): CodeEmitter {
        if (!instr) {
            return this;
        }

        switch (instr.instructionType) {
            case EInstructionTypes.k_PartFxDecl:
                this.emitPartFxDecl(instr as IPartFxInstruction);
                break;
            case EInstructionTypes.k_PartFxPass:
                this.emitPartFxPass(instr as IPartFxPassInstruction);
                break;
            default:
                super.emit(instr)
        }

        return this;
    }


    // emnitPartFx(partFx: IPartFxInstruction) {
    //     this.begin();
    //     this.emitComment('ATTENTION: This file is autogenerated.\nDo not change it directly.');
    //     this.end();
    //     //partFx.particle
    // }
}

export function translate(instr: IInstruction): string {
    const emitter = new FxEmitter();
    emitter.emit(instr);
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


