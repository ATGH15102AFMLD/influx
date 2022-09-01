import { Analyzer, Context } from "@lib/fx/analisys/Analyzer";
import { ArithmeticExprInstruction } from "@lib/fx/analisys/instructions/ArithmeticExprInstruction";
import { RelationalExprInstruction, RelationOperator } from "@lib/fx/analisys/instructions/RelationalExprInstruction";
import { ConditionalExprInstruction } from "@lib/fx/analisys/instructions/ConditionalExprInstruction";
import { ProgramScope } from "@lib/fx/analisys/ProgramScope";
import { IArithmeticOperator, IExprInstruction, ILogicalOperator, IStmtInstruction } from "@lib/idl/IInstruction";
import { ISLDocument } from "@lib/idl/ISLDocument";
import { INodeInputSlot, INodeOutputSlot, INodeSlot, LGraph, LGraphCanvas, LGraphNode, LiteGraph, LLink, SerializedLGraphNode } from "litegraph.js";

import { AST, CodeEmitterNode, GraphContext, LGraphNodeFactory } from "./GraphNode";
import { LogicalExprInstruction } from "@lib/fx/analisys/instructions/LogicalExprInstruction";

function producer(env: () => ISLDocument): LGraphNodeFactory {
    const nodes = <LGraphNodeFactory>{};

    class Operator extends CodeEmitterNode {
        protected get a(): CodeEmitterNode {
            return this.getInputNode('a');
        }

        protected get b(): CodeEmitterNode {
            return this.getInputNode('b');
        }
    }

    const TYPES = ['float', 'int', 'uint', 'float3'];

    const ARITHMETIC = [
        { name: "Summ", operator: "+", search: "summ '+'" },
        { name: "Subtraction", operator: "-", search: "subtraction '-'" },
        { name: "Mult", operator: "*", search: "multiply '*'" },
        { name: "Div", operator: "/", search: "division '/'" },
        { name: "Mod", operator: "%", search: "modulo '%'" }
    ];

    const TYPE_LIST = TYPES.join(',');

    ARITHMETIC.forEach(desc => {
            class Arithmetic extends Operator {
                static desc = desc.name;

                constructor() {
                    super(desc.name);
                    this.addInput("a", TYPE_LIST);
                    this.addInput("b", TYPE_LIST);
                    this.addOutput("value", TYPE_LIST);
                    this.size = [100, 50];
                    this.shape = LiteGraph.ROUND_SHAPE;
                }

        
                override compute(context: GraphContext, program: ProgramScope): IStmtInstruction[] {
                    if (this.locals || 
                        !this.inputs.every((x, i) => this.isInputConnected(i))) {
                        return [];
                    }
    
                    const deps = super.compute(context, program);
                    const scope = program.currentScope;
                    const operator = desc.operator as IArithmeticOperator;
                    const left = this.a.exec(context, program, this.getOriginalSlot('a'));
                    const right = this.b.exec(context, program, this.getOriginalSlot('b'));
                    // IP: todo - calc proper type
                   
                    const type = Analyzer.checkTwoOperandExprTypes(context, operator, left.type, right.type);

                    for (const name of ['a', 'b']) {
                        this.getInputInfo(name).type = left.type.name;
                        this.getInputLink(name).type = left.type.name;
                    }
                    this.getOutputInfo('value').type = type.name;

                    const expr = new ArithmeticExprInstruction({ scope, left, right, operator, type });
                    return [ ...deps, ...this.addLocal(context, program, expr.type.name, expr) ];
                }


                override exec(context: Context, program: ProgramScope, slot: number): IExprInstruction {
                    let leftNode = this.a;
                    let rightNode = this.b;
    
                    if (!leftNode || !rightNode) {
                        this.emitError(`All inputs must be conected.`);
                        return null;
                    }
    
                    if (!this.locals)
                        return null;
                    return AST(context, program).idexpr(this.locals[slot]);
                }

               
                override getTitle(): string {
                    const title = `${this.getInputInfo('a').name} ${desc.operator} ${this.getInputInfo('b').name}`;
                    return this.flags.collapsed? desc.operator : title;
                }
                

                override getDocs(): string {
                    return `Operator '${desc.search}'.`
                }

                override onConnectionsChange(type: number, slotIndex: number, isConnected: boolean, link: LLink, ioSlot: INodeInputSlot | INodeOutputSlot) {
                    for (let name of ['a', 'b']) {
                        let slot = this.getInputInfo(name);
                        if (!slot.link) slot.type = TYPE_LIST;
                    }
                    super.onConnectionsChange(type, slotIndex, isConnected, link, ioSlot);
                }
            }

            nodes[`operators/${desc.search}`] = Arithmetic;
    });

    const relations = [
        { name: "Equal", operator: "==", search: "equal '=='" },
        { name: "NotEqual", operator: "!=", search: "not equal '!='" },
        { name: "Less", operator: "<", search: "less '<'" },
        { name: "Greater", operator: ">", search: "greater '>'" },
        { name: "LessThan", operator: "<=", search: "less than '<='" },
        { name: "GreaterThan", operator: ">=", search: "greater than '>='" }
    ];

    // todo: add support of different types
    relations.forEach(desc => {
        class Relation extends Operator {
            static desc = desc.name;

            constructor() {
                super(desc.name);
                this.addInput("a", TYPES.join(','));
                this.addInput("b", TYPES.join(','));
                this.addOutput("value", "bool");
                this.size = [100, 50];
            }

            override compute(context: GraphContext, program: ProgramScope): IStmtInstruction[] {
                if (this.locals || 
                    !this.inputs.every((x, i) => this.isInputConnected(i))) {
                    return [];
                }

                const deps = super.compute(context, program);
                const scope = program.currentScope;
                const operator = desc.operator as RelationOperator;

                let leftNode = this.a;
                let rightNode = this.b;

                const left = leftNode.exec(context, program, this.getOriginalSlot('a'));
                const right = rightNode.exec(context, program, this.getOriginalSlot('b'));

                for (const name of ['a', 'b']) {
                    this.getInputInfo(name).type = left.type.name;
                    this.getInputLink(name).type = left.type.name;
                }

                const expr = new RelationalExprInstruction({ scope, left, right, operator });
                return [ ...deps, ...this.addLocal(context, program, expr.type.name, expr) ];
            }


            override exec(context: Context, program: ProgramScope, slot: number): IExprInstruction {
                let leftNode = this.a;
                let rightNode = this.b;

                if (!leftNode || !rightNode) {
                    this.emitError(`All inputs must be conected.`);
                    return null;
                }

                if (!this.locals)
                    return null;
                return AST(context, program).idexpr(this.locals[slot]);
            }


            override getTitle(): string {
                const title = `${this.getInputInfo('a').name} ${desc.operator} ${this.getInputInfo('b').name}`;
                return this.flags.collapsed? desc.operator : title;
            }

            override getDocs(): string {
                return `Operator '${desc.search}'.`
            }

            override onConnectionsChange(type: number, slotIndex: number, isConnected: boolean, link: LLink, ioSlot: INodeInputSlot | INodeOutputSlot) {
                for (let name of ['a', 'b']) {
                    let slot = this.getInputInfo(name);
                    if (!slot.link) slot.type = TYPE_LIST;
                }
                super.onConnectionsChange(type, slotIndex, isConnected, link, ioSlot);
            }
        }

        nodes[`operators/${desc.search}`] = Relation;
    });


    const logic = [
        { name: "And", operator: "&&", search: "and '&&'" },
        { name: "Or", operator: "||", search: "or '||'" },
    ];

    logic.forEach(desc => {
        class Logic extends Operator {
            static desc = desc.name;

            constructor() {
                super(desc.name);
                this.addInput("a", 'bool');
                this.addInput("b", 'bool');
                this.addOutput("value", "bool");
                this.size = [100, 50];
            }

            override compute(context: GraphContext, program: ProgramScope): IStmtInstruction[] {
                if (this.locals || 
                    !this.inputs.every((x, i) => this.isInputConnected(i))) {
                    return [];
                }

                const deps = super.compute(context, program);
                const scope = program.currentScope;
                const operator = desc.operator as ILogicalOperator;

                let leftNode = this.a;
                let rightNode = this.b;

                const left = leftNode.exec(context, program, this.getOriginalSlot('a'));
                const right = rightNode.exec(context, program, this.getOriginalSlot('b'));

                const expr = new LogicalExprInstruction({ scope, left, right, operator });
                return [ ...deps, ...this.addLocal(context, program, expr.type.name, expr) ];
            }


            override exec(context: Context, program: ProgramScope, slot: number): IExprInstruction {
                let leftNode = this.a;
                let rightNode = this.b;

                if (!leftNode || !rightNode) {
                    this.emitError(`All inputs must be conected.`);
                    return null;
                }

                if (!this.locals)
                    return null;
                return AST(context, program).idexpr(this.locals[slot]);
            }


            override getTitle(): string {
                const title = `${this.getInputInfo('a').name} ${desc.operator} ${this.getInputInfo('b').name}`;
                return this.flags.collapsed? desc.operator : title;
            }

            override getDocs(): string {
                return `Operator '${desc.search}'.`
            }
        }

        nodes[`operators/${desc.search}`] = Logic;
    });


    class Conditional extends Operator {
        static desc = 'Conditional';

        constructor() {
            super('Conditional');
            this.addInput("cond", 'bool');
            this.addInput("a", TYPE_LIST);
            this.addInput("b", TYPE_LIST);
            this.addOutput("value", TYPE_LIST);
            this.size = this.computeSize();
        }

        protected get cond(): CodeEmitterNode {
            return this.getInputNode('cond');
        }

        override compute(context: GraphContext, program: ProgramScope): IStmtInstruction[] {
            if (this.locals || 
                !this.inputs.every((x, i) => this.isInputConnected(i))) {
                return [];
            }

            const deps = super.compute(context, program);
            const scope = program.currentScope;

            let leftNode = this.a;
            let rightNode = this.b;
            let condNode = this.cond;

            const left = leftNode.exec(context, program, this.getOriginalSlot('a'));
            const right = rightNode.exec(context, program, this.getOriginalSlot('b'));
            const cond = condNode.exec(context, program, this.getOriginalSlot('cond'));

            const expr = new ConditionalExprInstruction({ scope, cond, left, right });

            for (const name of ['a', 'b']) {
                this.getInputInfo(name).type = left.type.name;
                this.getInputLink(name).type = left.type.name;
            }
            this.getOutputInfo('value').type = expr.type.name;

            return [ ...deps, ...this.addLocal(context, program, expr.type.name, expr) ];
        }


        override exec(context: Context, program: ProgramScope, slot: number): IExprInstruction {
            let leftNode = this.a;
            let rightNode = this.b;

            if (!leftNode || !rightNode) {
                this.emitError(`All inputs must be conected.`);
                return null;
            }

            if (!this.locals)
                return null;
            return AST(context, program).idexpr(this.locals[slot]);
        }


        override getTitle(): string {
            const title = `${this.getInputInfo('cond').name} ? ${this.getInputInfo('a').name} : ${this.getInputInfo('b').name}`;
            return title;
        }

        override getDocs(): string {
            return `Conditional operator '?'.`
        }

        override onConnectionsChange(type: number, slotIndex: number, isConnected: boolean, link: LLink, ioSlot: INodeInputSlot | INodeOutputSlot) {
            for (let name of ['a', 'b']) {
                let slot = this.getInputInfo(name);
                if (!slot.link) slot.type = TYPE_LIST;
            }
            super.onConnectionsChange(type, slotIndex, isConnected, link, ioSlot);
        }
    }

    nodes[`operators/conditional '?'`] = Conditional;

    return nodes;
}

export default producer;

