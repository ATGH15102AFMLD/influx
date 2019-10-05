import { IPassInstruction, IFunctionDeclInstruction, ITechniqueInstruction, ICompileExprInstruction, IStructDeclInstruction, ITypeInstruction } from "@lib/idl/IInstruction";


export interface IPartFxPassInstruction extends IPassInstruction {
    readonly sorting: boolean;
    readonly prerenderRoutine: ICompileExprInstruction;
    readonly material: ITypeInstruction;
}


 export interface IPartFxInstruction extends ITechniqueInstruction {

    readonly spawnRoutine: ICompileExprInstruction;
    readonly initRoutine: ICompileExprInstruction;
    readonly updateRoutine: ICompileExprInstruction;

    readonly particle: ITypeInstruction;

    readonly passList: IPartFxPassInstruction[];
 }