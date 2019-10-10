import { EInstructionTypes, IExprInstruction, IExprStmtInstruction } from "@lib/idl/IInstruction";
import { IInstructionSettings, Instruction } from "@lib/fx/instructions/Instruction";
import { StmtInstruction } from "@lib/fx/instructions/StmtInstruction";


export interface IExprStmtInstructionSettings extends IInstructionSettings {
    expr: IExprInstruction;
}

/**
 * Represent expr;
 * EMPTY_OPERTOR ExprInstruction 
 */
export class ExprStmtInstruction extends StmtInstruction implements IExprStmtInstruction {
    protected _expr: IExprInstruction;

    constructor({ expr, ...settings }: IExprStmtInstructionSettings) {
        super({ instrType: EInstructionTypes.k_ExprStmtInstruction, ...settings });

        this._expr = Instruction.$withParent(expr, this);
    }

    get expr(): IExprInstruction {
        return this._expr;
    }

    toCode(): string {
        return this._expr.toCode() + ';';
    }
}
