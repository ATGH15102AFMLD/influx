import { assert, isNull } from '@lib/common';
import { EInstructionTypes, IFunctionDefInstruction, IIdInstruction, IInitExprInstruction, IVariableDeclInstruction, IVariableTypeInstruction } from "@lib/idl/IInstruction";

import { DeclInstruction, IDeclInstructionSettings } from './DeclInstruction';
import { type } from './helpers';
import { Instruction } from './Instruction';

// import * as SystemScope from '@lib/fx/analisys/SystemScope';

export interface IVariableDeclInstructionSettings extends IDeclInstructionSettings {
    id: IIdInstruction;
    type: IVariableTypeInstruction;
    init?: IInitExprInstruction;

    // EVariableUsageFlags
    usageFlags?: number;
}

/**
 * @deprecated
 */
export enum EVariableUsageFlags {
    k_Local     = 0x01,
    k_Global    = 0x02,
    k_Argument  = 0x04,
}

/**
 * Represent type var_name [= init_expr]
 * EMPTY_OPERATOR VariableTypeInstruction IdInstruction InitExprInstruction
 */
export class VariableDeclInstruction extends DeclInstruction implements IVariableDeclInstruction {

    protected _id: IIdInstruction;
    protected _type: IVariableTypeInstruction;
    protected _initExpr: IInitExprInstruction;
    protected _usageFlags: number;

 
    constructor({ id, type, init = null, usageFlags = 0, ...settings }: IVariableDeclInstructionSettings) {
        super({ instrType: EInstructionTypes.k_VariableDecl, ...settings });

        this._id = Instruction.$withParent(id, this);
        this._type = Instruction.$withNoParent(type);
        this._initExpr = Instruction.$withParent(init, this);
        this._usageFlags = usageFlags;

        assert(!this.isParameter() || (isNull(this.parent) || this.parent.instructionType == EInstructionTypes.k_FunctionDef));
        assert(this.isLocal() || !this.isLocal());
        assert(!this.isParameter() || this.isLocal());
    }


    get initExpr(): IInitExprInstruction {
        return this._initExpr;
    }


    /** @deprecated */
    get defaultValue(): any {
        this._initExpr.evaluate();
        return this._initExpr.getEvalValue();
    }


    get type(): IVariableTypeInstruction {
        return <IVariableTypeInstruction>this._type;
    }


    get name(): string {
        return this._id.name;
    }


    get id(): IIdInstruction {
        return this._id;
    }


    get fullName(): string {
        if (this.isField() &&
            type.findParentVariableDecl(<IVariableTypeInstruction>this.parent)) {

            var name = '';
            var parentType = this.parent.instructionType;

            if (parentType === EInstructionTypes.k_VariableType) {
                name = type.resolveVariableDeclFullName(<IVariableTypeInstruction>this.parent);
            }

            name += '.' + this.name;
            return name;
        }

        return this.name;
    }


    isGlobal(): boolean {
        return !!(this._usageFlags & EVariableUsageFlags.k_Global);
    }


    isLocal(): boolean {
        return !!(this._usageFlags & EVariableUsageFlags.k_Local);
    }

    isParameter(): boolean {
        return !!(this._usageFlags & EVariableUsageFlags.k_Argument);
    }


    isUniform(): boolean {
        return this.type.hasUsage('uniform');
    }


    isField(): boolean {
        if (isNull(this.parent)) {
            return false;
        }

        var eParentType: EInstructionTypes = this.parent.instructionType;
        if (eParentType === EInstructionTypes.k_VariableType ||
            eParentType === EInstructionTypes.k_ComplexType ||
            eParentType === EInstructionTypes.k_SystemType) {
            return true;
        }

        return false;
    }

    
    toCode(): string {
        var code = '';        
        code = this.type.toCode();
        code += ' ' + this.id.toCode();

        if (this.type.isNotBaseArray()) {
            var iLength: number = this.type.length;
            code += '[' + iLength + ']';
        }

        if (!isNull(this.initExpr) &&
            // !SystemScope.isSamplerType(this.type) && // TODO: is it correct check?
            !this.isUniform()) {
            code += '=' + this.initExpr.toCode();
        }
        return code;
    }
}

