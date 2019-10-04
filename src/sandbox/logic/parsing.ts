import { analyze } from '@lib/fx/Analyzer';
import { EffectParser } from '@lib/fx/EffectParser';
import { Diagnostics } from '@lib/util/Diagnostics';
import * as evt from '@sandbox/actions/ActionTypeKeys';
import IStoreState, { IParserParams } from '@sandbox/store/IStoreState';
import { createLogic } from 'redux-logic';

function deepEqual(a: Object, b: Object): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

let parser: EffectParser = null;
let parserParamsLast: IParserParams = null;

async function createParser(parserParams: IParserParams) {
    const { grammar, mode, type } = parserParams;

    if (!grammar) {
        return;
    }

    const parserChanged = !deepEqual(parserParams, parserParamsLast);

    if (!parserChanged) {
        return;
    }

    console.log('%c Creating parser....', 'background: #222; color: #bada55');
    parserParamsLast = parserParams;
    parser = new EffectParser();

    if (!parser.init(grammar, mode, type)) {
        console.error('Could not initialize parser!');
        parser = null;
    } else {
        console.log('%c [ DONE ]', 'background: #222; color: #bada55');
    }
}

const PARSING_ERROR_PREFIX = 'parsing-error';
const ANALYSIS_ERROR_PREFIX = 'analysis-error';

function cleanupErrors(state, dispatch, errorPrefix) {
    for (let name in state.sourceFile.markers) {
        if (name.startsWith(`${errorPrefix}-`)) {
            dispatch({ type: evt.SOURCE_CODE_REMOVE_MARKER, payload: { name } });
        }
    }
}


function emitErrors(errors, dispatch, errorPrefix) {
    errors.forEach(err => {
        let { loc, message } = err;
        let marker = {
            name: `${errorPrefix}-${message}`,
            range: loc,
            type: 'error',
            tooltip: message
        };
        dispatch({ type: evt.SOURCE_CODE_ADD_MARKER, payload: marker });
    })
}


async function processParsing(state: IStoreState, dispatch): Promise<void> {
    const { content, filename } = state.sourceFile;

    cleanupErrors(state, dispatch, PARSING_ERROR_PREFIX);

    if (!content || !parser) {
        return;
    }

    parser.setParseFileName(filename);

    // All diagnostic exceptions should be already handled inside parser.
    let res = await parser.parse(content);

    let report = parser.getDiagnostics();
    let errors = report.messages.map(mesg => ({ loc: Diagnostics.asRange(mesg), message: mesg.content }));

    emitErrors(errors, dispatch, PARSING_ERROR_PREFIX);
    console.log(Diagnostics.stringify(parser.getDiagnostics()));

    dispatch({ type: evt.SOURCE_CODE_PARSING_COMPLETE, payload: { parseTree: parser.getSyntaxTree() } });
}


async function processAnalyze(state: IStoreState, dispatch): Promise<void> {
    const { parseTree, filename } = state.sourceFile;

    cleanupErrors(state, dispatch, ANALYSIS_ERROR_PREFIX);

    if (!parseTree) {
        return;
    }


    const res = analyze(filename, parseTree);

    let { diag, root, scope } = res;
    let errors = diag.messages.map(mesg => ({ loc: Diagnostics.asRange(mesg), message: mesg.content }));

    emitErrors(errors, dispatch, ANALYSIS_ERROR_PREFIX);
    console.log(Diagnostics.stringify(diag));

    dispatch({ type: evt.SOURCE_CODE_ANALYSIS_COMPLETE, payload: { root, scope} });
}


const updateParserLogic = createLogic<IStoreState>({
    type: [evt.GRAMMAR_CONTENT_SPECIFIED, evt.GRAMMAR_FILE_SPECIFIED, evt.PARSER_PARAMS_CHANGED],

    async process({ getState, action }, dispatch, done) {
        let parserParams = getState().parserParams;
        await createParser(parserParams);
        done();
    }
});


const updateSourceContentLogic = createLogic<IStoreState>({
    type: [evt.SOURCE_CODE_MODIFED, evt.SOURCE_FILE_LOADED],
    latest: true,
    debounce: 500,

    async process({ getState }, dispatch, done) {
        await processParsing(getState(), dispatch);
        done();
    }
});


const parsingCompleteLogic = createLogic<IStoreState>({
    type: [evt.SOURCE_CODE_PARSING_COMPLETE],
    
    async process({ getState }, dispatch, done) {
        await processAnalyze(getState(), dispatch);
        done();
    }
});



export default [
    updateParserLogic,
    updateSourceContentLogic,
    parsingCompleteLogic
];