export enum EAnalyzerErrors {
    SystemTypeRedefinition = 2202,
    TypeRedefinition,
    VariableRedefinition,
    SystemVariableRedefinition,
    FunctionRedifinition,
    SystemFunctionRedefinition,

    UnsupportedTypeDecl,
    UnsupportedExpr,
    UnknownVarName,
    InvalidArithmeticOperation,
    InvalidArithmeticAssigmentOperation,
    InvalidAssigmentOperation,
    InvalidLeftHandSideInAssignment,
    InvalidRelationalOperation,
    InvalidLogicOperation,
    InvalidConditionType ,
    InvalidConditonValueTypes,
    InvalidCastTypeUsage,
    InvalidCastTypeNotBase,
    InvalidCastUnknownType,
    InvalidUnaryOperation,
    InvalidPostfixNotArray,
    InvalidPostfixNotIntIndex,
    InvalidPostfixNotField,
    InvalidPostfixArithmetic,
    InvalidComplexNotFunction,
    InvalidComplexNotType,
    InvalidComplexNotConstructor,
    InvalidCompileNotFunction,
    InvalidCompileFunctionNotValid,
    FunctionRedefinition,
    InvalidWhileCondition,
    InvalidDoWhileCondition,
    InvalidIfCondition,
    InvalidForInitExpr,
    InvalidForInitEmptyIterator,
    InvalidForConditionEmpty,
    InvalidForConditionRelation,
    InvalidForStepEmpty,
    InvalidForStepOperator,
    InvalidForStepExpr,
    InvalidNewFieldForStructName,
    InvalidNewFieldForStructSematic,
    InvalidNewAnnotationVar,
    InvalidFunctionParameterDefenitionDefaultNeeded,
    CannotChooseFunction,
    InvalidFuncDefenitionReturnType,
    InvalidSystemFunctionReturnType,
    InvalidTypeNameNotType,
    InvalidTypeVectorMatrix,
    TechniqueNameRedefinition,
    InvalidFunctionUsageRecursion,
    InvalidFunctionUsageBlackList,
    InvalidFunctionUsageVertex,
    InvalidFunctionUsagePixel,
    FunctionVertexRedefinition,
    FunctionPixelRedefinition,
    InvalidReturnStmtVoid,
    InvalidReturnStmtEmpty,
    InvalidReturnStmtTypesNotEqual,
    InvalidFunctionReturnType,
    InvalidFunctionParameterUsage,
    InvalidTypeForWriting,
    InvalidTypeForReading,
    InvalidVariableInitializing,
    UnsupportedStateIndex,
    InvalidSamplerTexture,
    CannotCalcPadding,
    ImportedComponentNotExists,
    InvalidFunctionReturnStmtNotFound,
    UnsupportedProvideAs,
    UnreachableCode,

    // PartFx_InvalidInitRoutine
};
