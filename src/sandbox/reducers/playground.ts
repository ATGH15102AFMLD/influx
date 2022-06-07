import { ETechniqueType, IScope } from "@lib/idl/IInstruction";
import { IPartFxInstruction } from "@lib/idl/part/IPartFx";
import * as evt from '@sandbox/actions/ActionTypeKeys';
import { IPlaygroundActions, IPlaygroundEmitterUpdate } from "@sandbox/actions/ActionTypes";
import { handleActions } from '@sandbox/reducers/handleActions';
import IStoreState, { IPlaygroundState } from "@sandbox/store/IStoreState";

const initialState: IPlaygroundState = {
    emitter: null,
    $revision: 0
};



export default handleActions<IPlaygroundState, IPlaygroundActions>({
    [evt.PLAYGROUND_EMITER_UPDATE]: (state, action: IPlaygroundEmitterUpdate) =>
        ({ ...state, emitter: action.payload.emitter, $pipeline: state.$revision + 1 }),
}, initialState);


export const getEmitterName = (playground: IPlaygroundState) => playground.emitter ? playground.emitter.name : null;
export function filterPartFx(scope: IScope): IPartFxInstruction[] {
    if (!scope) {
        return [];
    }

    const map = scope.techniques;
    return Object.keys(map)
        .filter(name => map[name].type === ETechniqueType.k_PartFx)
        .map(name => <IPartFxInstruction>map[name]);
}

export const getPlaygroundState = (state: IStoreState): IPlaygroundState => state.playground;