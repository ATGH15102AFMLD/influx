import { createTextDocument } from "@lib/fx/TextDocument";
import { LIB_TEXT_DOCUMENT } from "./common";
import { LGraphNodeEx } from "./IGraph";
import { InitRoutineHLSL, SpawnRoutineHLSL, UpdateRoutineHLSL } from './lib';
import { LibLoader } from "./LibLoader";


const SPAWN_TEXT_DOCUMENT = createTextDocument("://SpawnRoutine.hlsl", SpawnRoutineHLSL);
const INIT_TEXT_DOCUMENT = createTextDocument("://SpawnRoutine.hlsl", InitRoutineHLSL);
const UPDATE_TEXT_DOCUMENT = createTextDocument("://SpawnRoutine.hlsl", UpdateRoutineHLSL);
const docs = [LIB_TEXT_DOCUMENT, SPAWN_TEXT_DOCUMENT, INIT_TEXT_DOCUMENT, UPDATE_TEXT_DOCUMENT];
let ll = new LibLoader();

docs.forEach(doc => ll.parse(doc));

for (let node in ll.nodes) {
    LGraphNodeEx.nodesDocs[node] = ll.nodes[node];
}