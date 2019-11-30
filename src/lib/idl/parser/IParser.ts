import { IMap } from '@lib/idl/IMap';
import { IDiagnosticReport } from '@lib/util/Diagnostics';
import { StringRef } from "@lib/util/StringRef";

export enum ENodeCreateMode {
    k_Default,
    k_Necessary,
    k_Not
}

export enum EParserCode {
    // k_Pause,
    k_Ok,
    k_Error
}

export enum EParserType {
    k_LR0,
    k_LR1,
    k_LALR
}

export enum EParseMode {
    k_AllNode = 0x0001,
    k_Negate = 0x0002,
    k_Add = 0x0004,
    k_Optimize = 0x0008,
    k_DebugMode = 0x0010
}

export enum ETokenType {
    k_NumericLiteral = 1,
    k_CommentLiteral,
    k_StringLiteral,
    k_PunctuatorLiteral,
    k_WhitespaceLiteral,
    k_NewlineLiteral,
    k_IdentifierLiteral,
    k_KeywordLiteral,
    k_Unknown,
    k_End
}


export type IFile = StringRef;

export interface IPosition {
    file: IFile;
    line: number; 
    column: number;
    offset?: number;
}

// todo: add support for range over multiple files;
export interface IRange {
    start: IPosition;
    end: IPosition;
}

export interface IToken {
    index: number;
    value: string;
    name?: string;
    type?: ETokenType;

    loc?: IRange;
    // range?: number[];
}


/**
 * Grammar rule corresponding to the entry from grammar file.
 */
export interface IRule {
    left: string;
    right: string[];

    /**
     * rule index based on parser's '_nRules'; 
     */
    index: number;
}

export enum EOperationType {
    k_Error = 100,
    k_Shift,
    k_Reduce,
    k_Success,
    k_Ok
}

export type IRuleFunction = () => EOperationType;

export interface IParseNode {
    children: IParseNode[];
    parent: IParseNode;
    name: string;
    value: string;
    loc?: IRange;
}

export interface IParseTree {
    readonly nodes: IParseNode[];
    readonly lastNode: IParseNode;
    readonly optimized: boolean;
    readonly root: IParseNode;

    addToken(pToken: IToken): void;
    reduceByRule(pRule: IRule, eCreate: ENodeCreateMode): void;
    finishTree(): void;
    
    $pop(loc?: IRange): void;


    /** @deprecated */
    clone(): IParseTree;
    /** @deprecated */
    toString(): string;
    /** @deprecated */
    toHTMLString(node?: IParseNode, padding?: string): string;
}


export interface IParserState {
    source: string;
    fileName: IFile;
    tree: IParseTree;
    types: IMap<boolean>;
    stack: number[];
    token: IToken;
    caller: any;
    includeFiles?: IMap<boolean>;
}

export interface IParser {
    isTypeId(value: string): boolean;

    init(grammar: string, mode?: EParseMode, type?: EParserType): boolean;
    parse(source: string): Promise<EParserCode>;

    setParseFileName(fileName: string): void;
    getParseFileName(): IFile;

    getSyntaxTree(): IParseTree;
    getGrammarSymbols(): Map<string, string>;
    getDiagnostics(): IDiagnosticReport;
}


export interface IParserParams {
    grammar: string;
    type: EParserType;
    mode: number;
}


export type ExpectedSymbols = Set<string>;
