import { EParseMode, EParserType } from '../../lib/idl/parser/IParser';
import { GRAMMAR_FILE_SPECIFIED, PARSER_PARAMS_CHANGED, SOURCE_CODE_MODIFED, SOURCE_FILE_LOADED,
    SOURCE_FILE_LOADING_FAILED, SOURCE_FILE_REQUEST, GRAMMAR_CONTENT_SPECIFIED } from './ActionTypeKeys';

// source file api

export interface ISourceFileRequest {
    readonly type: typeof SOURCE_FILE_REQUEST;
    readonly payload: { readonly filename: string; };
}

export interface ISourceFileLoaded {
    readonly type: typeof SOURCE_FILE_LOADED;
    readonly payload: { readonly content: string; };
}

export interface ISourceFileLoadingFailed {
    readonly type: typeof SOURCE_FILE_LOADING_FAILED;
    readonly payload: { readonly error: Error; };
}

export interface ISourceCodeModified {
    readonly type: typeof SOURCE_CODE_MODIFED;
    readonly payload: { readonly content: string; };
}

export type SourceFileActions = ISourceFileRequest | ISourceFileLoaded | ISourceFileLoadingFailed | ISourceCodeModified;

// grammar api (simplified)

export interface IGrammarFileSpecified {
    readonly type: typeof GRAMMAR_FILE_SPECIFIED;
    readonly payload: { readonly filename: string; };
}

export interface IGrammarContentSpecified {
    readonly type: typeof GRAMMAR_CONTENT_SPECIFIED;
    readonly payload: { readonly content: string; };
}

export interface IParserParamsChanged {
    readonly type: typeof PARSER_PARAMS_CHANGED;
    readonly payload: { mode: number; type: EParserType; };
}

export type ParserParamsActions = IGrammarFileSpecified | IGrammarContentSpecified | IParserParamsChanged;

export type ActionTypes = SourceFileActions & ParserParamsActions;

export default ActionTypes;
