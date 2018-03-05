import { IFunctionDeclInstruction, ISimpleInstruction, ITypeDeclInstruction, IIdInstruction, ITypeInstruction, EInstructionTypes, IVariableTypeInstruction, EFunctionType, IInstruction, IDeclInstruction, IVariableDeclInstruction, EVarUsedMode, IStmtInstruction } from "../../idl/IInstruction";
import { DeclInstruction } from "./DeclInstruction";
import { IdInstruction } from "./IdInstruction";
import { isNull } from "../../common";
import { IMap } from "../../idl/IMap";
import { VariableTypeInstruction } from "./VariableTypeInstruction";
import { ExprTemplateTranslator } from "../ExprTemplateTranslator"


export class SystemFunctionInstruction extends DeclInstruction implements IFunctionDeclInstruction {
    private _exprTranslator: ExprTemplateTranslator ;
    private _name: IIdInstruction;
    private _args: IVariableDeclInstruction[];
    private _returnType: ITypeInstruction;

    private _definition: string;
    private _implementation: string;

    private _extSystemTypeList: ITypeDeclInstruction[];
    private _extSystemFunctionList: IFunctionDeclInstruction[];

    constructor(name: IdInstruction, returnType: IVariableTypeInstruction,
                exprTranslator: ExprTemplateTranslator,
                args: IVariableDeclInstruction[], definition: string, implementation: string) {

        super(null, null, null, EInstructionTypes.k_SystemFunctionInstruction);

        this._name = name;
        this._returnType = returnType;
        this._args = args;

        // if (!isNull(args)) {
        //     for (var i: number = 0; i < args.length; i++) {
        //         var pArgument: TypedInstruction = new TypedInstruction(null);
        //         pArgument.type = (args[i]);
        //         pArgument.parent = (this);

        //         this._args.push(pArgument);
        //     }
        // }

        this._definition = definition;
        this._implementation = implementation;
    
        this._extSystemTypeList = [];
        this._extSystemFunctionList = [];

        this._exprTranslator = exprTranslator;
    }


    get definition(): any {
        return this._definition;
    }

    
    get implementation(): any {
        return this._implementation;
    }


    toCode(): string {
        return this._definition + this._implementation;
    }


    setUsedSystemData(pTypeList: ITypeDeclInstruction[],
        pFunctionList: IFunctionDeclInstruction[]): void {

        this._extSystemTypeList = pTypeList;
        this._extSystemFunctionList = pFunctionList;
    }

    closeSystemDataInfo(): void {
        for (var i: number = 0; i < this._extSystemFunctionList.length; i++) {
            var pFunction: IFunctionDeclInstruction = this._extSystemFunctionList[i];

            var pTypes = pFunction.extSystemTypeList;
            var pFunctions = pFunction.extSystemFunctionList;

            for (var j: number = 0; j < pTypes.length; j++) {
                if (this._extSystemTypeList.indexOf(pTypes[j]) === -1) {
                    this._extSystemTypeList.push(pTypes[j]);
                }
            }

            for (var j: number = 0; j < pFunctions.length; j++) {
                if (this._extSystemFunctionList.indexOf(pFunctions[j]) === -1) {
                    this._extSystemFunctionList.unshift(pFunctions[j]);
                }
            }
        }
    }

    get exprTranslator(): ExprTemplateTranslator {
        return this._exprTranslator;
    }

    get nameID(): IIdInstruction {
        return this._name;
    }

    get arguments(): IVariableDeclInstruction[] {
        return this._args;
    }

    get numArgsRequired(): number {
        return this._args.length;
    }

    get type(): IVariableTypeInstruction {
        return this.returnType;
    }

    get returnType(): IVariableTypeInstruction {
        return this.type;
    }

    get functionType(): EFunctionType {
        return EFunctionType.k_Function;
    }

    get vertexShader(): IFunctionDeclInstruction {
        return null;
    }

    get pixelShader(): IFunctionDeclInstruction {
        return null;
    }

    get stringDef(): string {
        return "system_func";
    }

    get attributeVariableMap(): IMap<IVariableDeclInstruction> {
        return null;
    }

    get varyingVariableMap(): IMap<IVariableDeclInstruction> {
        return null;
    }

    get uniformVariableMap(): IMap<IVariableDeclInstruction> {
        return null;
    }

    get textureVariableMap(): IMap<IVariableDeclInstruction> {
        return null;
    }

    get usedComplexTypeMap(): IMap<ITypeInstruction> {
        return null;
    }

    get attributeVariableKeys(): number[] {
        return null;
    }

    get varyingVariableKeys(): number[] {
        return null;
    }

    get uniformVariableKeys(): number[] {
        return null;
    }

    get textureVariableKeys(): number[] {
        return null;
    }

    get usedComplexTypeKeys(): number[] {
        return null;
    }

    get extSystemFunctionList(): IFunctionDeclInstruction[] {
        return this._extSystemFunctionList;
    }

    get extSystemTypeList(): ITypeDeclInstruction[] {
        return this._extSystemTypeList;
    }

    get usedFunctionList(): IFunctionDeclInstruction[] {
        return null;
    }

    closeArguments(pArguments: IInstruction[]): IInstruction[] {
        return this._exprTranslator.toInstructionList(pArguments);
    }

    clone(pRelationMap?: IMap<IInstruction>): SystemFunctionInstruction {
        return this;
    }

    addOutVariable(pVariable: IVariableDeclInstruction): boolean {
        return false;
    }

    getOutVariable(): IVariableDeclInstruction {
        return null;
    }

    markUsedAs(eUsedType: EFunctionType): void {
    }

    isUsedAs(eUsedType: EFunctionType): boolean {
        return true;
    }

    isUsedAsFunction(): boolean {
        return true;
    }

    isUsedAsVertex(): boolean {
        return true;
    }

    isUsedAsPixel(): boolean {
        return true;
    }

    markUsedInVertex(): void {
    }

    markUsedInPixel(): void {
    }

    isUsedInVertex(): boolean {
        return null;
    }

    isUsedInPixel(): boolean {
        return null;
    }

    isUsed(): boolean {
        return null;
    }

    checkVertexUsage(): boolean {
        return this.vertex;
    }

    checkPixelUsage(): boolean {
        return this.pixel;
    }

    checkDefinitionForVertexUsage(): boolean {
        return false;
    }

    checkDefinitionForPixelUsage(): boolean {
        return false;
    }

    canUsedAsFunction(): boolean {
        return true;
    }

    notCanUsedAsFunction(): void { }

    addUsedFunction(pFunction: IFunctionDeclInstruction): boolean {
        return false;
    }

    addUsedVariable(pVariable: IVariableDeclInstruction): void {

    }

    convertToVertexShader(): IFunctionDeclInstruction {
        return null;
    }

    convertToPixelShader(): IFunctionDeclInstruction {
        return null;
    }

    prepareForVertex(): void { }
    prepareForPixel(): void { }

    addUsedVariableType(pType: IVariableTypeInstruction, eUsedMode: EVarUsedMode): boolean {
        return false;
    }

    generateInfoAboutUsedData(): void {

    }

    getAttributeVariableMap(): IMap<IVariableDeclInstruction> {
        return null;
    }

    isBlackListFunction(): boolean {
        return false;
    }

    addToBlackList(): void {}

    $overwriteType(type: EFunctionType) {
        console.error("@undefined_behavior");
    } 

    $linkToImplementationScope(scope: number) {
        console.error("@undefined_behavior");
    }
}

