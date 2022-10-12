import bf from "@lib/bf";
import { assert, isDef, isDefAndNotNull, isNull } from "@lib/common";
import { EDiagnosticCategory, IDiagnosticReport } from "@lib/idl/IDiagnostics";
import { IMap } from "@lib/idl/IMap";
import { ITextDocument } from "@lib/idl/ITextDocument";
import { EOperationType, EParserCode, IASTConfig, IASTDocument, IASTDocumentFlags as EASTParsingFlags, IFile, ILexer, IParseNode, IParser, IParseTree, IPosition, IRange, IRuleFunction, ISyntaxTable, IToken } from "@lib/idl/parser/IParser";
import { Lexer } from "@lib/parser/Lexer";
import { ParseTree } from "@lib/parser/ParseTree";
import { END_SYMBOL, ERROR, UNKNOWN_TOKEN } from "@lib/parser/symbols";
import { extendRange } from "@lib/parser/util";
import { DiagnosticException, Diagnostics } from "@lib/util/Diagnostics";


export enum EParsingErrors {
    SyntaxUnknownError = 2051,
    SyntaxUnexpectedEOF,
    SyntaxRecoverableStateNotFound,

    GeneralParsingLimitIsReached,
};


export enum EParsingWarnings {
    MacroUnknownWarning = 3000,
}


export class ParsingDiagnostics extends Diagnostics<IMap<any>> {
    constructor() {
        super("Parsing diagnostics", 'P');
    }


    protected resolveFilename(category: EDiagnosticCategory, code: number, desc: IMap<any>): string {
        return desc.file;
    }


    protected resolveRange(category: EDiagnosticCategory, code: number, desc: IMap<any>): IRange {
        if (category === EDiagnosticCategory.k_Warning) {
            switch (code) {
                case EParsingWarnings.MacroUnknownWarning:
                    return desc.loc;
            }
        }

        //
        // errors
        //
        
        switch (code) {
            case EParsingErrors.SyntaxUnknownError:
            case EParsingErrors.SyntaxUnexpectedEOF:
                return desc.token.loc;
        }
        
        return null;
    }


    //
    // NODE: position is being resolved only in case of failed range resolving
    //
    protected resolvePosition(category: EDiagnosticCategory, code: number, desc: IMap<any>): IPosition {
        console.assert(code != EParsingErrors.SyntaxUnknownError);
        return { line: desc.line, column: 0, file: null };
    }


    protected diagnosticMessages() {
        return {
            [EParsingErrors.SyntaxUnknownError]: "Syntax error during parsing. Token: '{token.value}'\n" +
                "Line: {token.loc.start.line}. Column: {token.loc.start.column}.",
            [EParsingErrors.SyntaxUnexpectedEOF]: "Syntax error. Unexpected EOF.",
            [EParsingErrors.GeneralParsingLimitIsReached]: "Parsing limit is reached.",
            [EParsingErrors.SyntaxRecoverableStateNotFound]: "Recoverable state not found."
        };
    }

    protected resolveDescription(code: number, category: EDiagnosticCategory, desc: IMap<any>): string {
        let descList = this.diagnosticMessages();
        if (isDefAndNotNull(descList[code])) {
            return super.resolveDescription(code, category, desc);
        }

        let { file, loc, ...data } = desc;
        if (category == EDiagnosticCategory.k_Warning) {
            return `${EParsingWarnings[code]}: ${JSON.stringify(data)}`;
        }
        return `${EParsingErrors[code]}: ${JSON.stringify(data)}`;
    }
}


function cloneToken(token: IToken): IToken {
    return {
        ...token,
        loc: {
            start: { ...token.loc.start },
            end: { ...token.loc.end }
        }
    };
}


// class Context {
//     allowErrorRecoverty: boolean = true;
//     developerMode: boolean = false;

//     lexer: Lexer;
//     diagnostics: ParsingDiagnostics;
//     knownTypes: Set<string>;
//     ruleFunctions: Map<string, IRuleFunction>;
    
//     stack: number[] = [0];


//     constructor() {
//         this.diagnostics = new ParsingDiagnostics;
//     }

//     readToken() {
//         return this.lexer.getNextToken();
//     }


//     private error(code: number, token: IToken) {
//         this.diagnostics.error(code, { ...this.lexer.getLocation(), token });
//     }

//     private critical(code: number, token: IToken = null) {
//         this.diagnostics.critical(code, { ...this.lexer.getLocation(), token });
//     }
// }
 

export class ASTDocument implements IASTDocument {
    protected parser: IParser;
    protected knownTypes: Set<string>;
    protected ruleFunctions: Map<string, IRuleFunction>;

    protected diag: ParsingDiagnostics;

    protected tree: IParseTree;
    protected stack: number[];
    
    protected lexer: ILexer;
    protected token: IToken;

    constructor(config: IASTConfig) {
        assert(config.parser, 'parser engine is not defined');
        this.init(config);
    }

    protected init({ parser, knownTypes = new Set(), ruleFunctions = new Map }: IASTConfig) {
        this.parser = parser;
        this.knownTypes = knownTypes;
        this.ruleFunctions = ruleFunctions;
    }


    get uri(): IFile {
        // TODO: use uri from original textDocument
        return this.lexer.document.uri;
    }


    get diagnosticReport(): IDiagnosticReport {
        let lexerReport = this.lexer.getDiagnosticReport();
        let parserReport = this.diag.resolve();
        return Diagnostics.mergeReports([lexerReport, parserReport]);
    }

    get root(): IParseNode {
        return this.tree.root;
    }


    async parse(textDocument: ITextDocument, flags: number = EASTParsingFlags.k_Optimize): Promise<EParserCode> {
        const developerMode = bf.testAll(flags, EASTParsingFlags.k_DeveloperMode);
        const allowErrorRecoverty = true;
        const optimizeTree = bf.testAll(flags, EASTParsingFlags.k_Optimize);

        this.diag = new ParsingDiagnostics;
        this.tree = new ParseTree(optimizeTree);
        this.stack = [0];
        
        this.setTextDocument(textDocument);
        this.token = await this.readToken();

        if (this.token.name === END_SYMBOL) {
            return EParserCode.k_Ok;
        }

        await this.run({ developerMode, allowErrorRecoverty });

        // clear context

        // this.stack = null;
        // this.lexer = null;
        // this.token = null;
        // diag
        // tree

        // end of clear

        if (this.diag.hasErrors()) {
            console.error('parsing was ended with errors.');
            return EParserCode.k_Error;
        }

        return EParserCode.k_Ok;
    }

    protected setTextDocument(textDocument: ITextDocument): void {
        this.lexer = new Lexer({
            engine: this.parser.lexerEngine,
            knownTypes: this.knownTypes
        });
        this.lexer.setTextDocument(textDocument);
    }


    protected async readToken(): Promise<IToken> {
        return this.lexer.getNextToken();
    }

    
    protected emitError(code: number, token: IToken) {
        this.diag.error(code, { token });
    }

    
    protected emitCritical(code: number, token: IToken = null) {
        this.diag.critical(code, { token });
    }


    private async restoreState(syntaxTable: ISyntaxTable, parseTree: ParseTree, stack: number[], causingErrorToken: IToken, errorToken: IToken): Promise<number> {
        while (true) {
            let recoverableState = -1;
            for (let i = stack.length - 1; i >= 0; --i) {
                const errorOp = syntaxTable[stack[i]][ERROR];
                const isRecoverableState = (isDef(errorOp) &&
                    errorOp.type === EOperationType.k_Shift &&
                    syntaxTable[errorOp.stateIndex][causingErrorToken.name]);
                if (isRecoverableState) {
                    recoverableState = i;
                    break;
                }
            }


            if (recoverableState !== -1) {
                const recoveredStateIndex = stack[recoverableState];
                // current op will be: syntaxTable[recoveredStateIndex][ERROR];

                let stackDiff = stack.length - 1 - recoverableState;
                while (stackDiff != 0) {
                    // extend error token location with the already processed tokens
                    parseTree.$pop(errorToken.loc);
                    stack.pop();
                    stackDiff--;
                }

                // recoverable state found so continue normal processing as it would be before the error
                return recoveredStateIndex;
            }

            // TODO: optimize this call!
            extendRange(errorToken.loc, causingErrorToken.loc);

            if (causingErrorToken.value === END_SYMBOL) {
                // state cant be recovered
                break;
            }

            // try to restore from the next token
            // FIXME: 
            const nextToken: IToken = await this.readToken();
            Object.keys(nextToken).forEach(key => causingErrorToken[key] = nextToken[key]);
        }
        return -1;
    }

    
    private operationAdditionalAction(stateIndex: number, grammarSymbol: string): EOperationType {
        const funcName = this.parser.findFunctionByState(stateIndex, grammarSymbol);
        if (!isNull(funcName)) {
            assert(!!this.ruleFunctions.has(funcName));
            return this.ruleFunctions.get(funcName)();
        }
        return EOperationType.k_Ok;
    }


    private async run({ developerMode = false, allowErrorRecoverty = true }): Promise<void> {

        const { syntaxTable } = this.parser;
        const { stack, tree } = this;

        const undefinedToken: IToken = { index: -1, name: null, value: null };
        let causingErrorToken: IToken = undefinedToken;

        // debug mode
        const opLimit = 64e5;
        let opCounter = 0;

        try {
            breakProcessing:
            while (true) {
                // global recursion prevention in debug mode
                if (developerMode) {
                    if (opCounter > opLimit) {
                        this.emitCritical(EParsingErrors.GeneralParsingLimitIsReached);
                    }
                    opCounter++;
                }

                let currStateIndex = stack[stack.length - 1];
                let op = syntaxTable[currStateIndex][this.token.name];

                if (allowErrorRecoverty) {
                    if (!op) {
                        // recursion prevention
                        if (causingErrorToken.index !== this.token.index) {
                            if (this.token.name === END_SYMBOL) {
                                this.emitError(EParsingErrors.SyntaxUnexpectedEOF, this.token);
                            } else {
                                this.emitError(EParsingErrors.SyntaxUnknownError, this.token);
                            }
                        } else {
                            // one more attempt to recover but from the next token
                            this.token = await this.readToken();
                            if (this.token.index === -1) debugger;
                            // NOTE: in order to prevent recusrion on END_SYMBOL
                            causingErrorToken = undefinedToken;
                            continue;
                        }

                        causingErrorToken = cloneToken(this.token);
                        // token = { ...token, name: ERROR };
                        this.token = { ...cloneToken(this.token), name: ERROR };
                    }

                    op = syntaxTable[currStateIndex][this.token.name];

                    const errorProcessing = this.token.name === ERROR;
                    const errorReductionEnded = !op || (errorProcessing && (op.type === EOperationType.k_Shift));

                    // state must be recovered if operation is undefined or error reduction was ended. 
                    if (errorReductionEnded) {
                        // NOTE: recoveryToken, token, stack and parseTree will be update imlicitly inside the state restore routine. 
                        let recoveryToken = cloneToken(causingErrorToken);
                        while (recoveryToken.name === UNKNOWN_TOKEN) {
                            recoveryToken = await this.readToken();
                            if (recoveryToken.index === -1) debugger;
                        }
                        currStateIndex = await this.restoreState(syntaxTable, <ParseTree>tree, stack, recoveryToken, this.token /* error token */);
                        if (currStateIndex === -1) {
                            this.emitCritical(EParsingErrors.SyntaxRecoverableStateNotFound);
                        }

                        // perform error shift op.
                        op = syntaxTable[currStateIndex][this.token.name]; // token.name === 'ERROR'
                        stack.push(op.stateIndex);
                        tree.addToken(this.token/* error token */);
                        this.token = recoveryToken;

                        // const nextOp = syntaxTable[op.stateIndex][token.name];
                        // if (nextOp.type === EOperationType.k_Reduce) {
                        //     tokenBuffer.push(rec);
                        // }

                        // return to normal precesing loop
                        continue;
                    }
                }

                if (isDef(op)) {
                    switch (op.type) {
                        case EOperationType.k_Success:
                            break breakProcessing;

                        case EOperationType.k_Shift:
                            {
                                const stateIndex = op.stateIndex;
                                stack.push(stateIndex);
                                tree.addToken(this.token);

                                const additionalOperationCode = this.operationAdditionalAction(stateIndex, this.token.name);
                                if (additionalOperationCode === EOperationType.k_Error) {
                                    this.emitCritical(EParsingErrors.SyntaxUnknownError, this.token);
                                } else if (additionalOperationCode === EOperationType.k_Ok) {
                                    this.token = await this.readToken();
                                    if (this.token.index === -1) debugger;
                                }
                            }
                            break;

                        case EOperationType.k_Reduce:
                            {
                                const ruleLength = op.rule.right.length;
                                stack.length -= ruleLength;

                                const stateIndex = syntaxTable[stack[stack.length - 1]][op.rule.left].stateIndex;

                                stack.push(stateIndex);
                                tree.reduceByRule(op.rule, this.parser.getRuleCreationMode(op.rule.left));

                                const additionalOperationCode = this.operationAdditionalAction(stateIndex, op.rule.left);
                                if (additionalOperationCode === EOperationType.k_Error) {
                                    this.emitCritical(EParsingErrors.SyntaxUnknownError, this.token);
                                }
                            }
                            break;
                    }
                } else {
                    assert(!allowErrorRecoverty, `unexpected end, something went wrong :/`);
                    this.emitCritical(EParsingErrors.SyntaxUnknownError, this.token);
                }
            }

            tree.finishTree();
        } catch (e) {
            if (!(e instanceof DiagnosticException)) {
                throw e;
            }
        }
    }
}
