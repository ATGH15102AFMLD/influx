import { assert } from '@lib/common';
import { ETechniqueType, IScope } from '@lib/idl/IInstruction';
import { IPartFxInstruction } from '@lib/idl/part/IPartFx';
import * as evt from '@sandbox/actions/ActionTypeKeys';
import { IDebuggerActions, IDebuggerOptionsChanged, IDebuggerStartDebug, IPlaygroundActions, IPlaygroundPipelineUpdate, ISourceCodeAddBreakpoint, ISourceCodeAddMarker, ISourceCodeAnalysisComplete, ISourceCodeModified, ISourceCodeParsingComplete, ISourceCodeRemoveBreakpoint, ISourceCodeRemoveMarker, ISourceFileActions, ISourceFileDropState, ISourceFileLoaded, ISourceFileLoadingFailed, ISourceFileRequest } from '@sandbox/actions/ActionTypes';
import { handleActions } from '@sandbox/reducers/handleActions';
import { IDebuggerState, IFileState, IStoreState } from '@sandbox/store/IStoreState';

const initialState: IFileState = {
    filename: null,
    content: null,
    error: null,
    markers: {},
    breakpoints: [],
    parseTree: null,
    analysis: null,
    debugger: {
        entryPoint: null,
        runtime: null,
        options: {
            colorize: true,
            disableOptimizations: true,
            autocompile: false
        }
    },
    pipeline: null,
    // HACK: additional counter in order to call component's update in case of shadow pipeline reloading
    $pipeline: 0
};


export default handleActions<IFileState, ISourceFileActions | IDebuggerActions | IPlaygroundActions>({
    [evt.SOURCE_FILE_REQUEST]: (state, action: ISourceFileRequest) =>
        ({ ...state, filename: action.payload.filename }),

    [evt.SOURCE_FILE_LOADED]: (state, action: ISourceFileLoaded) =>
        ({ ...state, content: action.payload.content }),

    [evt.SOURCE_FILE_LOADING_FAILED]: (state, action: ISourceFileLoadingFailed) =>
        ({
            ...state,
            error: action.payload.error,
            // NOTE: temp solution (clean up all info about prev file)
            content: null,
            debugger: { ...state.debugger, runtime: null },
            breakpoints: [],
            parseTree: null,
            analysis: null,
            pipeline: null,
            $pipeline: 0
        }),

    [evt.SOURCE_FILE_DROP_STATE]: (state, action: ISourceFileDropState) =>
        ({
            ...state,
            error: null,
            content: null,
            debugger: { ...state.debugger, runtime: null },
            breakpoints: [],
            parseTree: null,
            analysis: null,
            pipeline: null,
            $pipeline: 0
        }),

    [evt.SOURCE_CODE_MODIFED]: (state, action: ISourceCodeModified) =>
        ({
            ...state, content: action.payload.content
            // , debugger: { entryPoint: null, runtime: null, ...state.debugger } =
        }),

    [evt.SOURCE_CODE_PARSING_COMPLETE]: (state, action: ISourceCodeParsingComplete) =>
        ({ ...state, parseTree: action.payload.parseTree }),

    [evt.SOURCE_CODE_ANALYSIS_COMPLETE]: (state, action: ISourceCodeAnalysisComplete) =>
        ({ ...state, analysis: action.payload.result }),

    //
    // markers
    //

    [evt.SOURCE_CODE_ADD_MARKER]: (state, action: ISourceCodeAddMarker) =>
        ({ ...state, markers: { ...state.markers, [action.payload.name]: action.payload } }),

    [evt.SOURCE_CODE_REMOVE_MARKER]: (state, action: ISourceCodeRemoveMarker) => {
        const markers = { ...state.markers };
        delete markers[action.payload.name];
        return { ...state, markers };
    },

    //
    // breakpoints
    //

    [evt.SOURCE_CODE_ADD_BREAKPOINT]: (state, action: ISourceCodeAddBreakpoint) => {
        assert(state.breakpoints.indexOf(action.payload.line) === -1);
        return ({ ...state, breakpoints: [...state.breakpoints, action.payload.line] })
    },

    [evt.SOURCE_CODE_REMOVE_BREAKPOINT]: (state, action: ISourceCodeRemoveBreakpoint) => {
        return { ...state, breakpoints: state.breakpoints.filter(ln => ln !== action.payload.line) };
    },

    //
    // debugger
    //

    [evt.DEBUGGER_START_DEBUG]: (state, action: IDebuggerStartDebug) => {
        const options = state.debugger.options;
        const { entryPoint, runtime } = action.payload;
        return { ...state, debugger: { entryPoint, runtime, options } };
    },

    [evt.DEBUGGER_RESET]: (state) => {
        const { debugger: { options } } = state;
        return { ...state, debugger: { entryPoint: null, runtime: null, options } };
    },

    [evt.DEBUGGER_OPTIONS_CHANGED]: (state: IFileState, action: IDebuggerOptionsChanged) => {
        const options = { ...state.debugger.options, ...action.payload.options };
        const $debugger = { ...state.debugger, options };
        // console.log(JSON.stringify(options, null, '\t'));
        return { ...state, debugger: $debugger };
    },

    //
    // playground
    //

    [evt.PLAYGROUND_PIPELINE_UPDATE]: (state, action: IPlaygroundPipelineUpdate) =>
        ({ ...state, pipeline: action.payload.pipeline, $pipeline: state.$pipeline + 1 })

}, initialState);


//- Selectors

export const getFileState = (state: IStoreState): IFileState => state.sourceFile;
export const getDebugger = (state: IStoreState): IDebuggerState => getFileState(state).debugger;
export const getScope = (file: IFileState): IScope => file.analysis ? file.analysis.scope : null;
export const getPipelineName = (file: IFileState) => file.pipeline ? file.pipeline.name() : null;
export function filterPartFx(scope: IScope): IPartFxInstruction[] {
    if (!scope) {
        return [];
    }

    const map = scope.techniqueMap;
    return Object.keys(map)
        .filter(name => map[name].type === ETechniqueType.k_PartFx)
        .map(name => <IPartFxInstruction>map[name]);
}


