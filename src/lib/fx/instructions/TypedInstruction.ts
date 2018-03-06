import { Instruction, IInstructionSettings } from "./Instruction";
import { ITypedInstruction, ITypeInstruction, EInstructionTypes, IInstruction, ITypeUseInfoContainer, EVarUsedMode } from "../../idl/IInstruction";
import { IMap } from "../../idl/IMap";
import { isNull } from "../../common";
import { IParseNode } from "../../idl/parser/IParser";


export interface ITypedInstructionSettings extends IInstructionSettings {
    type: ITypeInstruction;
}


/**
 * For example: 
 *      int x;
 *      int main();
 */

export class TypedInstruction extends Instruction implements ITypedInstruction {
    protected _type: ITypeInstruction;

    constructor({ type, ...settings }: ITypedInstructionSettings) {
        super({ instrType: EInstructionTypes.k_TypedInstruction, ...settings });
        this._type = type;
    }


    get type(): ITypeInstruction {
        return this._type;
    }

    
    addUsedData(pUsedDataCollector: IMap<ITypeUseInfoContainer>, eUsedMode?: EVarUsedMode): void {
        console.error("@pure_virtual");
    }
}
