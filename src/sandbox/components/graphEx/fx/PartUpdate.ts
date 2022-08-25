import { InstructionCollector } from "@lib/fx/analisys/instructions/InstructionCollector";
import { ProgramScope } from "@lib/fx/analisys/ProgramScope";
import { ISLDocument } from "@lib/idl/ISLDocument";
import { Diagnostics } from "@lib/util/Diagnostics";
import { LGraphCanvas, LGraphNode, LiteGraph } from "litegraph.js";

import { AST, CodeEmitterNode, CodeEmitterStmt, GraphContext, LGraphNodeFactory, PartRoutine } from "../GraphNode";


function producer(env: () => ISLDocument): LGraphNodeFactory
{
    const desc = "UpdateRoutine";
    const name = "UpdateRoutine";

    const HIDDEN_CONNECTION = { visible: false };


    class PartUpdate extends PartRoutine {
        static desc = desc;

        constructor() {
            super(name);
            this.addOutput("stmts", LiteGraph.EVENT, HIDDEN_CONNECTION);
            this.update();
        }

        
        onDrop(node) {
            // todo: validate node
            if (this.connect('stmts', node, 'context')) {
                this.update();
                this.highlight(false);
            }
        }

        private extend(env: ISLDocument): ISLDocument {
            const uri = env.uri;
            const scope = env.root.scope;
            const program = new ProgramScope(scope);
            const context = new GraphContext(uri)
            
            this.onBeforeExecution(context, program);

            const ast = AST(context, program);
            context.beginFunc();
            const fdecl = ast.func(`bool UpdateRoutine(inout Part part, int partId)`, 
                () => (this.getOutputNodes(0) || []).map(node => node.compute(context, program)).flat());
            context.endFunc();
    
            const diagnosticReport = Diagnostics.mergeReports([env.diagnosticReport, context.diagnostics.resolve()]);
            const instructions = env.root.instructions.concat([ fdecl ]);
            const root = new InstructionCollector({ scope: program.globalScope, instructions });
            return { root, diagnosticReport, uri };
        }
    
        async run(env: ISLDocument): Promise<ISLDocument>
        {
            return this.extend(env);
        }

        getTitle(): string { return 'Update routine'; }
        getDocs(): string { return 'Determines state of particle after each update.'; }
    }

    return { [`fx/${desc}`]: PartUpdate };
}


export default producer;

