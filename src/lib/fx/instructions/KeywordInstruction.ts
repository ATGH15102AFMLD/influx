import { EInstructionTypes, IKeywordInstruction } from "../../idl/IInstruction";
import { Instruction } from "./Instruction";
import { IParseNode } from "../../idl/parser/IParser";

export class KeywordInstruction extends Instruction implements IKeywordInstruction {
    private _value: string;

	/**
	 * EMPTY_OPERATOR EMPTY_ARGUMENTS
	 */
    constructor(pNode: IParseNode, value: string) {
        super(pNode, EInstructionTypes.k_KeywordInstruction);
        this._value = value;
    }

    get value(): string {
        return this._value;
    }


    toString(): string {
        return this._value;
    }

    
    toCode(): string {
        return this._value;
    }
}
