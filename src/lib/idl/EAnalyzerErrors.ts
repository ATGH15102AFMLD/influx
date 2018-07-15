export enum EAnalyzerErrors {
    SystemTypeRedefinition = 2201,
    TypeRedefinition = 2202,
    VariableRedefinition = 2234,
    SystemVariableRedefinition = 2235,
    FunctionRedifinition = 2236,
    SystemFunctionRedefinition = 2237,

    UnsupportedTypeDecl = 2203,
    UnsupportedExpr = 2204,
    UnknownVarName = 2205,
    InvalidArithmeticOperation = 2206,
    InvalidArithmeticAssigmentOperation = 2207,
    InvalidAssigmentOperation = 2208,
    InvalidRelationalOperation = 2209,
    InvalidLogicOperation = 2210,
    InvalidConditionType = 2211,
    InvalidConditonValueTypes = 2212,
    InvalidCastTypeUsage = 2213,
    InvalidCastTypeNotBase = 2214,
    InvalidCastUnknownType = 2215,
    InvalidUnaryOperation = 2216,
    InvalidPostfixNotArray = 2217,
    InvalidPostfixNotIntIndex = 2218,
    InvalidPostfixNotField = 2219,
    InvalidPostfixArithmetic = 2221,
    InvalidComplexNotFunction = 2223,
    InvalidComplexNotType = 2224,
    InvalidComplexNotConstructor = 2225,
    InvalidCompileNotFunction = 2226,
    FunctionRedefinition = 2227,
    InvalidWhileCondition = 2228,
    InvalidDoWhileCondition = 2229,
    InvalidIfCondition = 2230,
    InvalidForInitExpr = 2231,
    InvalidForInitEmptyIterator = 2232,
    InvalidForConditionEmpty = 2233,
    InvalidForConditionRelation = 2238,
    InvalidForStepEmpty = 2239,
    InvalidForStepOperator = 2240,
    InvalidForStepExpr = 2241,
    InvalidNewFieldForStructName = 2242,
    InvalidNewFieldForStructSematic = 2243,
    InvalidNewAnnotationVar = 2244,
    InvalidFunctionParameterDefenitionDefaultNeeded = 2245,
    CannotChooseFunction = 2246,
    InvalidFuncDefenitionReturnType = 2247,
    InvalidSystemFunctionReturnType = 2249,
    InvalidTypeNameNotType = 2250,
    InvalidTypeVectorMatrix = 2251,
    TechniqueNameRedefinition = 2252,
    InvalidFunctionUsageRecursion = 2255,
    InvalidFunctionUsageBlackList = 2256,
    InvalidFunctionUsageVertex = 2257,
    InvalidFunctionUsagePixel = 2258,
    FunctionVertexRedefinition = 2259,
    FunctionPixelRedefinition = 2260,
    InvalidReturnStmtVoid = 2261,
    InvalidReturnStmtEmpty = 2262,
    InvalidReturnStmtTypesNotEqual = 2263,
    InvalidFunctionReturnType = 2264,
    InvalidFunctionParameterUsage = 2265,
    InvalidTypeForWriting = 2267,
    InvalidTypeForReading = 2268,
    InvalidVariableInitializing = 2269,
    UnsupportedStateIndex = 2270,
    InvalidSamplerTexture = 2271,
    CannotCalcPadding = 2272,
    ImportedComponentNotExists = 2277,
    InvalidFunctionReturnStmtNotFound = 2279,
    UnsupportedProvideAs = 2303
};

export enum EAnalyzerWarnings {
    UnsupportedRenderStateTypeUsed,

}