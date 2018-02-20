import { StmtInstruction } from "./StmtInstruction";
import { EAFXInstructionTypes, ECheckStage, IAFXInstruction, IAFXTypeUseInfoContainer, EVarUsedMode, IAFXExprInstruction, IAFXVariableDeclInstruction, IAFXStmtInstruction, IAFXVariableTypeInstruction } from "../../idl/IAFXInstruction";
import { isNull } from "../../common";
import { IMap } from "../../idl/IMap";
import { EEffectErrors } from "../../idl/EEffectErrors";
import { IParseNode } from "../../idl/parser/IParser";

/**
 * Represent for(forInit forCond ForStep) stmt
 * for ExprInstruction or VarDeclInstruction ExprInstruction ExprInstruction StmtInstruction
 */
export class ForStmtInstruction extends StmtInstruction {
    constructor(pNode: IParseNode) {
        super(pNode);
        this._pInstructionList = [null, null, null, null];
        this._eInstructionType = EAFXInstructionTypes.k_ForStmtInstruction;
    }

    _toFinalCode(): string {
        var sCode: string = "for(";

        sCode += this.instructions[0]._toFinalCode() + ";";
        sCode += this.instructions[1]._toFinalCode() + ";";
        sCode += this.instructions[2]._toFinalCode() + ")";
        sCode += this.instructions[3]._toFinalCode();

        return sCode;
    }

    check(eStage: ECheckStage, pInfo: any = null): boolean {
        var pInstructionList: IAFXInstruction[] = this.instructions;

        if (this._nInstructions !== 4) {
            this._setError(EEffectErrors.BAD_FOR_STEP_EMPTY);
            return false;
        }

        if (isNull(pInstructionList[0])) {
            this._setError(EEffectErrors.BAD_FOR_INIT_EMPTY_ITERATOR);
            return false;
        }

        if (pInstructionList[0].instructionType !== EAFXInstructionTypes.k_VariableDeclInstruction) {
            this._setError(EEffectErrors.BAD_FOR_INIT_EXPR);
            return false;
        }

        if (isNull(pInstructionList[1])) {
            this._setError(EEffectErrors.BAD_FOR_COND_EMPTY);
            return false;
        }

        if (pInstructionList[1].instructionType !== EAFXInstructionTypes.k_RelationalExprInstruction) {
            this._setError(EEffectErrors.BAD_FOR_COND_RELATION);
            return false;
        }

        if (pInstructionList[2].instructionType === EAFXInstructionTypes.k_UnaryExprInstruction ||
            pInstructionList[2].instructionType === EAFXInstructionTypes.k_AssignmentExprInstruction ||
            pInstructionList[2].instructionType === EAFXInstructionTypes.k_PostfixArithmeticInstruction) {

            var sOperator: string = pInstructionList[2].operator;
            if (sOperator !== "++" && sOperator !== "--" &&
                sOperator !== "+=" && sOperator !== "-=") {
                this._setError(EEffectErrors.BAD_FOR_STEP_OPERATOR, { operator: sOperator });
                return false;
            }
        }
        else {
            this._setError(EEffectErrors.BAD_FOR_STEP_EXPRESSION);
            return false;
        }

        return true;
    }

    addUsedData(pUsedDataCollector: IMap<IAFXTypeUseInfoContainer>,
        eUsedMode: EVarUsedMode = EVarUsedMode.k_Undefined): void {
        var pForInit: IAFXVariableDeclInstruction = <IAFXVariableDeclInstruction>this.instructions[0];
        var pForCondition: IAFXExprInstruction = <IAFXExprInstruction>this.instructions[1];
        var pForStep: IAFXExprInstruction = <IAFXExprInstruction>this.instructions[2];
        var pForStmt: IAFXStmtInstruction = <IAFXStmtInstruction>this.instructions[3];

        var pIteratorType: IAFXVariableTypeInstruction = pForInit.type;

        pUsedDataCollector[pIteratorType.instructionID] = <IAFXTypeUseInfoContainer>{
            type: pIteratorType,
        	isRead: false,
			isWrite: true,
			numRead: 0,
			numWrite: 1,
			numUsed: 1
		};

		pForCondition.addUsedData(pUsedDataCollector, eUsedMode);
		pForStep.addUsedData(pUsedDataCollector, eUsedMode);
		      pForStmt.addUsedData(pUsedDataCollector, eUsedMode);
	}
}
