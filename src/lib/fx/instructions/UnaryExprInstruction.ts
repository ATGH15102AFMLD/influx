import { EInstructionTypes, IExprInstruction, IUnaryExprInstruction, UnaryOperator } from '@lib/idl/IInstruction';
import { ExprInstruction } from './ExprInstruction';
import { IInstructionSettings, Instruction } from './Instruction';



export interface IUnaryExprInstructionSettings extends IInstructionSettings {
    expr: IExprInstruction;
    operator: UnaryOperator;
}


/**
 * Represent + - ! ++ -- expr
 * (+|-|!|++|--|) Instruction
 */
export class UnaryExprInstruction extends ExprInstruction implements IUnaryExprInstruction {
    protected _operator: UnaryOperator;
    protected _expr: IExprInstruction;


    constructor({ expr, operator, ...settings }: IUnaryExprInstructionSettings) {
        super({ instrType: EInstructionTypes.k_UnaryExprInstruction, type: expr.type, ...settings });
        
        this._expr = Instruction.$withParent(expr, this);
        this._operator = operator;
    }


    get operator(): UnaryOperator {
        return this._operator;
    }


    get expr(): IExprInstruction {
        return this._expr;
    }


    toCode(): string {
        var sCode: string = '';
        sCode += this.operator;
        sCode += this.expr.toCode();

        return sCode;
    }

    isConst(): boolean {
        return (<IExprInstruction>this.expr).isConst();
    }


    evaluate(): boolean {
        var op = this.operator;
        var expr = <IExprInstruction>this.expr;

        if (!expr.evaluate()) {
            return false;
        }

        var res: any = null;

        try {
            res = expr.getEvalValue();
            switch (op) {
                case '+':
                    res = +res;
                    break;
                case '-':
                    res = -res;
                    break;
                case '!':
                    res = !res;
                    break;
                case '++':
                    res = ++res;
                    break;
                case '--':
                    res = --res;
                    break;
            }
        } catch (e) {
            return false;
        }

        this._evalResult = res;
        return true;
    }
}
