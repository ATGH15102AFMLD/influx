import { Context } from "@lib/fx/analisys/Analyzer";
import { ArithmeticExprInstruction } from "@lib/fx/analisys/instructions/ArithmeticExprInstruction";
import { RelationalExprInstruction, RelationOperator } from "@lib/fx/analisys/instructions/RelationalExprInstruction";
import { ProgramScope } from "@lib/fx/analisys/ProgramScope";
import { IArithmeticOperator, IExprInstruction, IStmtInstruction } from "@lib/idl/IInstruction";
import { ISLDocument } from "@lib/idl/ISLDocument";
import { IParseNode } from "@lib/idl/parser/IParser";

import { AST, CodeEmitterNode, GraphContext, LGraphNodeFactory } from "./GraphNode";

function producer(env: () => ISLDocument): LGraphNodeFactory {
    const nodes = <LGraphNodeFactory>{};

    const types = ['float', 'int', 'uint', 'float3'];

    const arithmetic = [
        { name: "Summ", operator: "+", search: "summ '+'" },
        { name: "Subtraction", operator: "-", search: "subtraction '-'" },
        { name: "Mult", operator: "*", search: "multiply '*'" },
        { name: "Div", operator: "/", search: "division '/'" },
        { name: "Mod", operator: "%", search: "modulo '%'" }
    ];

    arithmetic.forEach(desc => {
        types.forEach(typeName => {
            class Node extends CodeEmitterNode {
                static desc = desc.name;

                constructor() {
                    super(desc.name);
                    this.addInput("a", typeName);
                    this.addInput("b", typeName);
                    this.addOutput("value", typeName);
                    this.size = [100, 50];
                }


                override compute(context: GraphContext, program: ProgramScope): IStmtInstruction[] {
                    if (this.locals || 
                        !this.inputs.every((x, i) => this.isInputConnected(i))) {
                        return [];
                    }
    
                    const deps = super.compute(context, program);
                    const scope = program.currentScope;
                    const operator = desc.operator as IArithmeticOperator;
    
                    let leftNode = this.getInputNode('a');
                    let rightNode = this.getInputNode('b');
    
                    const left = leftNode.exec(context, program, this.link('a'));
                    const right = rightNode.exec(context, program, this.link('b'));
                    // IP: todo - calc proper type
                    const type = left.type;
                    const expr = new ArithmeticExprInstruction({ scope, left, right, operator, type });
                    return [ ...deps, ...this.addLocal(context, program, expr.type.name, expr) ];
                }


                override exec(context: Context, program: ProgramScope, slot: number): IExprInstruction {
                    let leftNode = this.getInputNode('a');
                    let rightNode = this.getInputNode('b');
    
                    if (!leftNode || !rightNode) {
                        this.emitError(`All inputs must be conected.`);
                        return null;
                    }
    
                    if (!this.locals)
                        return null;
                    return AST(context, program).idexpr(this.locals[slot]);
                }


                getTitle(): string {
                    return `${this.getInputInfo(0).name} ${desc.operator} ${this.getInputInfo(1).name}`;
                }

                
                getDocs(): string {
                    return `Operator '${desc.search}'.`
                }
            }


            nodes[`operators/${desc.search} | ${typeName}`] = Node;
        });
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
        class Node extends CodeEmitterNode {
            static desc = desc.name;


            constructor() {
                super(desc.name);
                this.addInput("a", "float");
                this.addInput("b", "float");
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

                let leftNode = this.getInputNode('a');
                let rightNode = this.getInputNode('b');

                const left = leftNode.exec(context, program, this.link('a'));
                const right = rightNode.exec(context, program, this.link('b'));
                const expr = new RelationalExprInstruction({ scope, left, right, operator });
                return [ ...deps, ...this.addLocal(context, program, expr.type.name, expr) ];
            }


            override exec(context: Context, program: ProgramScope, slot: number): IExprInstruction {
                let leftNode = this.getInputNode('a');
                let rightNode = this.getInputNode('b');

                if (!leftNode || !rightNode) {
                    this.emitError(`All inputs must be conected.`);
                    return null;
                }

                if (!this.locals)
                    return null;
                return AST(context, program).idexpr(this.locals[slot]);
            }


            getTitle(): string {
                return `${this.getInputInfo(0).name} ${desc.operator} ${this.getInputInfo(1).name}`;
            }


            getDocs(): string {
                return `Operator '${desc.search}'.`
            }
        }

        nodes[`operators/${desc.search}`] = Node;
    });

    return nodes;
}

export default producer;

