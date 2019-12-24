import { assert, isEmpty, isNull } from "@lib/common";
import * as Bytecode from '@lib/fx/bytecode';
import * as VM from '@lib/fx/bytecode/VM';
import { createFXSLDocument } from "@lib/fx/FXSLDocument";
import { IScope } from "@lib/idl/IInstruction";
import { ITextDocument } from "@lib/idl/ITextDocument";
import { ETokenType, IRange, IToken } from "@lib/idl/parser/IParser";
import { Lexer } from "@lib/parser/Lexer";
import { END_SYMBOL } from "@lib/parser/symbols";
import { cloneRange } from "@lib/parser/util";

import { u8ArrayAsI32 } from "../bytecode/common";

function nativeFromString(str) {
    switch(str.toLowerCase()) {
        case 'true': return true;
        case 'false': return false;
        default:
            return Number(str) || 0;
    }
}

function exractComments(document: ITextDocument): IToken[] {
    const lexer = new Lexer({ skipComments: false });
    lexer.setup(document);

    let comments = [];
    let token: IToken;
    while((token = lexer.getNextToken()).value !== END_SYMBOL) {
        if (token.type === ETokenType.k_MultilineCommentLiteral) {
            comments.push(token);
        }
    }
    return comments;
}

export interface ITestCase {
    expr: string;
    expected: number | boolean;
    loc: IRange;
    passed?: boolean;
}

export interface ITest {
    name: string;
    cases: ITestCase[];
    loc: IRange;
    passed?: boolean;
}

export interface IAutotests {
    description: string;
    document: ITextDocument;
    tests: ITest[];
    passed?: boolean;
}

/**
 * 
 * @param source SL text document with test markup inside.
 */
export function parse(document: ITextDocument): IAutotests {
    let description = null;
    let tests = [];

    // NOTE: temp solution (until the parser gets comment support)
    exractComments(document).forEach((commentToken: IToken) => {
        let comment = commentToken.value.slice(2, -2);
        let list = comment
            .split('\n')
            .map(str => str.replace(/^\s*\*{1,2}\s*|\s*$/g, ''));

        let accum: string[] = [];
        let lastRule: { line: number, content: string } = null;
        let content: string;
        let rules: { line: number, content: string }[] = [];
        let line = -1;
        while (list.length) {
            line++;

            [content, list] = [list[0], list.slice(1)];

            if (content.match(/^\s*$/g)) {
                continue;
            }

            if (!content.match(/^@[\w]+/g)) {
                accum.push(content);
                continue;
            }

            if (lastRule) {
                rules.push({ content: [lastRule.content, ...accum.splice(0)].join(' '), line: lastRule.line});
            }

            lastRule = { content, line };
        };

        if (lastRule && lastRule.content) {
            rules.push({ content: [lastRule.content, ...accum.splice(0)].join(' '), line: lastRule.line});
        }

        let test: ITest = null;

        error:
        for (let rule of rules) {
            const { line, content } = rule;
            const parts = content.split(' ');
            const ruleName = parts[0].trim().toLowerCase();
            const loc = cloneRange(commentToken.loc);

            // FIXME: dirty hack in order to make the range correct
            loc.start.line += line;
            loc.start.offset = -1;
            loc.start.column = 0;
            loc.end.line = loc.start.line;
            loc.end.offset = loc.start.offset;
            loc.end.column = loc.start.column + 1;

            switch (ruleName) {
                case '@autotests':
                    assert(isNull(description));
                    description = parts.slice(1).join(' ');
                    break;
                case '@test':
                    assert(isNull(test));
                    if (test) {
                        break error;
                    }
                    test = { 
                        name: parts.slice(1).join(' '),
                        cases: [],
                        loc
                    };
                    break;
                case '@expected':
                    assert(!isNull(test));
                    if (!test) {
                        break error;
                    }
                    let [expr, expectedString] = parts.slice(1).join(' ').trim().slice(1, -1).split('==').map(str => str.trim());
                    assert(expr && expectedString);
                    
                    let expected = nativeFromString(expectedString);

                    test.cases.push({ expr, expected, loc });
                    break;
            }
        };

        if (test) {
            tests.push(test);
        }
    });

    return { description, document, tests };
}


export async function run(test: ITest, scope: IScope): Promise<boolean> {
    const { cases } = test;
    for (let exam of cases) {
        const { expr, expected } = exam;
        const uri = '://test';
        const source = `auto anonymous() { return (${expr}); }`;
        const document = await createFXSLDocument({ source, uri }, undefined, scope);
        if (!document.diagnosticReport.errors) {
            const func = document.root.scope.findFunction('anonymous', null);
            let { code } = Bytecode.translate(func);
            const result = u8ArrayAsI32(VM.evaluate(code));
            exam.passed = result === expected;
        }
    }

    test.passed = cases.reduce((acc, exam) => (acc && exam.passed), true);
    return test.passed;
}