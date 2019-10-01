const fs = require('fs').promises;
const diff = require('jest-diff');
const { DOMParser } = require('xmldom');
const ml = require('@ryel/multiline');
const { toString } = require('./DOM');
const {
    ForwardAxis,
    Fn,
    Scope,
    Predicate,
    PathExpr,
    evaluate,
} = require('./XPath');

expect.extend({
    toEqualXML (received, expected) {
        received = toString(received);
        expected = ml(expected);

        const pass = received === expected;
        const message = () => diff(expected, received);

        return { pass, message };
    },
});

describe('Scope', () => {
    it('Should find the closing index of a character, with no other scopes', () => {
        const received = Scope.indexOfClosing('()', Scope.Round);
        expect(received).toBe('()'.indexOf(')'));
    });

    it('Should find the closing index of a character, with other scopes', () => {
        const roundString = '(fn:true())';
        const round = Scope.indexOfClosing(roundString, Scope.Round);
        expect(round).toBe(roundString.indexOf(')', roundString.indexOf(')') + 1));

        const squareString = '(/w:p[fn:position()=1])';
        const square = Scope.indexOfClosing(squareString, Scope.Round);
        expect(square).toBe(squareString.indexOf(')', squareString.indexOf(')') + 1));
    });
});

describe('Parsing', () => {
    it('Should parse a child axis and name test', () => {
        const parsedPathExpr = PathExpr.parse('/w:document/w:body/w:p/w:bookmarkStart');
        expect(parsedPathExpr).toEqual([
            {
                Function: 'root',
                Arguments: [
                    [ {
                        Step: {
                            ForwardAxis: 'self',
                            NodeTest: {
                                AnyKindTest: [
                                    '*',
                                ],
                            },
                        },
                        PredicateList: [],
                    } ],
                ],
            },
            {
                Step: {
                    ForwardAxis: ForwardAxis.child,
                    NodeTest: {
                        NameTest: 'w:document',
                    },
                },
                PredicateList: [],
            },
            {
                Step: {
                    ForwardAxis: ForwardAxis.child,
                    NodeTest: {
                        NameTest: 'w:body',
                    },
                },
                PredicateList: [],
            },
            {
                Step: {
                    ForwardAxis: ForwardAxis.child,
                    NodeTest: {
                        NameTest: 'w:p',
                    },
                },
                PredicateList: [],
            },
            {
                Step: {
                    ForwardAxis: ForwardAxis.child,
                    NodeTest: {
                        NameTest: 'w:bookmarkStart',
                    },
                },
                PredicateList: [],
            },
        ]);
    });

    it('Should parse a descendant axis and name test', () => {
        const parsedPathExpr = PathExpr.parse('//w:bookmarkStart');
        expect(parsedPathExpr).toEqual([
            {
                Function: 'root',
                Arguments: [
                    [ {
                        Step: {
                            ForwardAxis: 'self',
                            NodeTest: {
                                AnyKindTest: [
                                    '*',
                                ],
                            },
                        },
                        PredicateList: [],
                    } ],
                ],
            },
            {
                Step: {
                    ForwardAxis: ForwardAxis['descendant-or-self'],
                    NodeTest: {
                        AnyKindTest: [
                            '*',
                        ],
                    },
                },
                PredicateList: [],
            },
            {
                Step: {
                    ForwardAxis: ForwardAxis.child,
                    NodeTest: {
                        NameTest: 'w:bookmarkStart',
                    },
                },
                PredicateList: [],
            },
        ]);
    });

    it('Should parse a position predicate', () => {
        const parsedPathExpr = PathExpr.parse('//w:p[1]/w:bookmarkStart');
        expect(parsedPathExpr).toEqual([
            {
                Function: 'root',
                Arguments: [
                    [ {
                        Step: {
                            ForwardAxis: 'self',
                            NodeTest: {
                                AnyKindTest: [
                                    '*',
                                ],
                            },
                        },
                        PredicateList: [],
                    } ],
                ],
            },
            {
                Step: {
                    ForwardAxis: ForwardAxis['descendant-or-self'],
                    NodeTest: {
                        AnyKindTest: [
                            '*',
                        ],
                    },
                },
                PredicateList: [],
            },
            {
                Step: {
                    ForwardAxis: ForwardAxis.child,
                    NodeTest: {
                        NameTest: 'w:p',
                    },
                },
                PredicateList: [
                    [ {
                        Literal: 1,
                    } ],
                ],
            },
            {
                Step: {
                    ForwardAxis: ForwardAxis.child,
                    NodeTest: {
                        NameTest: 'w:bookmarkStart',
                    },
                },
                PredicateList: [],
            },
        ]);
    });

    it('Should parse an attribute axis', () => {
        const parsedPathExpr = PathExpr.parse('//w:p[1]/w:bookmarkStart/attribute::*');
        expect(parsedPathExpr).toEqual([
            {
                Function: 'root',
                Arguments: [
                    [ {
                        Step: {
                            ForwardAxis: 'self',
                            NodeTest: {
                                AnyKindTest: [
                                    '*',
                                ],
                            },
                        },
                        PredicateList: [],
                    } ],
                ],
            },
            {
                Step: {
                    ForwardAxis: ForwardAxis['descendant-or-self'],
                    NodeTest: {
                        AnyKindTest: [
                            '*',
                        ],
                    },
                },
                PredicateList: [],
            },
            {
                Step: {
                    ForwardAxis: ForwardAxis.child,
                    NodeTest: {
                        NameTest: 'w:p',
                    },
                },
                PredicateList: [
                    [ {
                        Literal: 1,
                    } ],
                ],
            },
            {
                Step: {
                    ForwardAxis: ForwardAxis.child,
                    NodeTest: {
                        NameTest: 'w:bookmarkStart',
                    },
                },
                PredicateList: [],
            },
            {
                Step: {
                    ForwardAxis: ForwardAxis.attribute,
                    NodeTest: {
                        NameTest: '*',
                    },
                },
                PredicateList: [],
            },
        ]);
    });

    it('Should parse an attribute predicate', () => {
        const parsedPathExpr = PathExpr.parse('//w:p[@w14:paraId="604A9B26"]');
        expect(parsedPathExpr).toEqual([
            {
                Function: 'root',
                Arguments: [
                    [ {
                        Step: {
                            ForwardAxis: 'self',
                            NodeTest: {
                                AnyKindTest: [
                                    '*',
                                ],
                            },
                        },
                        PredicateList: [],
                    } ],
                ],
            },
            {
                Step: {
                    ForwardAxis: ForwardAxis['descendant-or-self'],
                    NodeTest: {
                        AnyKindTest: [
                            '*',
                        ],
                    },
                },
                PredicateList: [],
            },
            {
                Step: {
                    ForwardAxis: ForwardAxis.child,
                    NodeTest: {
                        NameTest: 'w:p',
                    },
                },
                PredicateList: [
                    [ {
                        ComparisonExpr: {
                            Left: [ {
                                Step: {
                                    ForwardAxis: ForwardAxis.attribute,
                                    NodeTest: {
                                        NameTest: 'w14:paraId',
                                    },
                                },
                                PredicateList: [],
                            } ],
                            Right: [ {
                                Literal: '604A9B26',
                            } ],
                            Operator: '=',
                        },
                    } ],
                ],
            },
        ]);
    });

    it('Should parse a following sibling axis and name test', () => {
        const parsedPathExpr = PathExpr.parse('//w:p[1]/w:pPr/following-sibling::w:bookmarkStart');
        expect(parsedPathExpr).toEqual([
            {
                Function: 'root',
                Arguments: [
                    [ {
                        Step: {
                            ForwardAxis: 'self',
                            NodeTest: {
                                AnyKindTest: [
                                    '*',
                                ],
                            },
                        },
                        PredicateList: [],
                    } ],
                ],
            },
            {
                Step: {
                    ForwardAxis: ForwardAxis['descendant-or-self'],
                    NodeTest: {
                        AnyKindTest: [
                            '*',
                        ],
                    },
                },
                PredicateList: [],
            },
            {
                Step: {
                    ForwardAxis: ForwardAxis.child,
                    NodeTest: {
                        NameTest: 'w:p',
                    },
                },
                PredicateList: [
                    [ {
                        Literal: 1,
                    } ],
                ],
            },
            {
                Step: {
                    ForwardAxis: ForwardAxis.child,
                    NodeTest: {
                        NameTest: 'w:pPr',
                    },
                },
                PredicateList: [],
            },
            {
                Step: {
                    ForwardAxis: ForwardAxis['following-sibling'],
                    NodeTest: {
                        NameTest: 'w:bookmarkStart',
                    },
                },
                PredicateList: [],
            },
        ]);
    });
});

describe('Evaluating', () => {
    describe('Functions', () => {
        describe('Boolean', () => {
            it('Should return false if its operand is an empty sequence', () => {
                expect(Fn.boolean([])).toBe(false);
            });

            it('Should return true if its operand is a sequence whose first item is a node', () => {
                expect(Fn.boolean([ {} ])).toBe(true);
            });

            it('Should return the operand unchanged if its operand is a boolean', () => {
                expect(Fn.boolean(true)).toBe(true);
                expect(Fn.boolean(false)).toBe(false);
            });

            it('Should return false if its operand is a string and has 0 length', () => {
                expect(Fn.boolean('')).toBe(false);
            });

            it('Should return true if its operand is a string and has > 0 length', () => {
                expect(Fn.boolean(' ')).toBe(true);
            });

            it('Should return false if its operand is a number and is NaN or equal to 0', () => {
                expect(Fn.boolean(0)).toBe(false);
            });

            it('Should return true if its operand is a number and is not NaN or 0', () => {
                expect(Fn.boolean(-0.1)).toBe(true);
            });

            it('Should raise a type error in all other cases', () => {
                expect(() => Fn.boolean({})).toThrow('Invalid argument type');
            });
        });
    });

    describe('Predicates', () => {
        it('Should evaluate to a boolean', () => {
            const Context = {
                Item: undefined,
                Position: 1,
                Size: 1,
            };

            const truthy = Predicate.evaluate({
                Context,
                PathExpr: [ { Literal: 1.2 } ],
            });
            expect(truthy).toBe(true);

            const falsy = Predicate.evaluate({
                Context,
                PathExpr: [ { Literal: '' } ],
            });
            expect(falsy).toBe(false);
        });
    });

    describe('Path expressions', () => {
        let document;
        beforeAll(async () => {
            const documentXml = await fs.readFile('./fixtures/document.xml', 'utf8');
            document = new DOMParser().parseFromString(documentXml);
        });

        describe('That are already parsed', () => {
            it('Should evaluate a child axis and name test', () => {
                const ItemSequence = PathExpr.evaluate({
                    Context: {
                        Item: document,
                        Size: undefined,
                        Position: undefined,
                    },
                    PathExpr: [
                        {
                            Function: 'root',
                            Arguments: [
                                [ {
                                    Step: {
                                        ForwardAxis: 'self',
                                        NodeTest: {
                                            AnyKindTest: [
                                                '*',
                                            ],
                                        },
                                    },
                                    PredicateList: [],
                                } ],
                            ],
                        },
                        {
                            Step: {
                                ForwardAxis: ForwardAxis.child,
                                NodeTest: {
                                    NameTest: 'w:document',
                                },
                            },
                            PredicateList: [],
                        },
                        {
                            Step: {
                                ForwardAxis: ForwardAxis.child,
                                NodeTest: {
                                    NameTest: 'w:body',
                                },
                            },
                            PredicateList: [],
                        },
                        {
                            Step: {
                                ForwardAxis: ForwardAxis.child,
                                NodeTest: {
                                    NameTest: 'w:p',
                                },
                            },
                            PredicateList: [],
                        },
                        {
                            Step: {
                                ForwardAxis: ForwardAxis.child,
                                NodeTest: {
                                    NameTest: 'w:bookmarkStart',
                                },
                            },
                            PredicateList: [],
                        },
                    ],
                });
                expect(ItemSequence).toHaveLength(1);
                expect(ItemSequence[0]).toEqualXML(`
                    <w:bookmarkStart
                        xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                        w:name="_GoBack"
                        w:id="0"
                    />
                `);
            });

            it('Should evaluate a descendant axis and name test', () => {
                const ItemSequence = PathExpr.evaluate({
                    Context: {
                        Item: document,
                        Size: undefined,
                        Position: undefined,
                    },
                    PathExpr: [
                        {
                            Function: 'root',
                            Arguments: [
                                [ {
                                    Step: {
                                        ForwardAxis: 'self',
                                        NodeTest: {
                                            AnyKindTest: [
                                                '*',
                                            ],
                                        },
                                    },
                                    PredicateList: [],
                                } ],
                            ],
                        },
                        {
                            Step: {
                                ForwardAxis: ForwardAxis['descendant-or-self'],
                                NodeTest: {
                                    AnyKindTest: [
                                        '*',
                                    ],
                                },
                            },
                            PredicateList: [],
                        },
                        {
                            Step: {
                                ForwardAxis: ForwardAxis.child,
                                NodeTest: {
                                    NameTest: 'w:bookmarkStart',
                                },
                            },
                            PredicateList: [],
                        },
                    ],
                });
                expect(ItemSequence).toHaveLength(1);
                expect(ItemSequence[0]).toEqualXML(`
                    <w:bookmarkStart
                        xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                        w:name="_GoBack"
                        w:id="0"
                    />
                `);
            });

            it('Should evaluate a position predicate', () => {
                const ItemSequence = PathExpr.evaluate({
                    Context: {
                        Item: document,
                        Size: undefined,
                        Position: undefined,
                    },
                    PathExpr: [
                        {
                            Function: 'root',
                            Arguments: [
                                [ {
                                    Step: {
                                        ForwardAxis: 'self',
                                        NodeTest: {
                                            AnyKindTest: [
                                                '*',
                                            ],
                                        },
                                    },
                                    PredicateList: [],
                                } ],
                            ],
                        },
                        {
                            Step: {
                                ForwardAxis: ForwardAxis['descendant-or-self'],
                                NodeTest: {
                                    AnyKindTest: [
                                        '*',
                                    ],
                                },
                            },
                            PredicateList: [],
                        },
                        {
                            Step: {
                                ForwardAxis: ForwardAxis.child,
                                NodeTest: {
                                    NameTest: 'w:p',
                                },
                            },
                            PredicateList: [
                                [ {
                                    ComparisonExpr: {
                                        Left: [ {
                                            Function: 'position',
                                            Arguments: [],
                                        } ],
                                        Right: [ {
                                            Literal: 1,
                                        } ],
                                        Operator: '=',
                                    },
                                } ],
                            ],
                        },
                        {
                            Step: {
                                ForwardAxis: ForwardAxis.child,
                                NodeTest: {
                                    NameTest: 'w:bookmarkStart',
                                },
                            },
                            PredicateList: [],
                        },
                    ],
                });
                expect(ItemSequence).toHaveLength(1);
                expect(ItemSequence[0]).toEqualXML(`
                    <w:bookmarkStart
                        xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                        w:name="_GoBack"
                        w:id="0"
                    />
                `);
            });

            it('Should evaluate an attribute axis', () => {
                const ItemSequence = PathExpr.evaluate({
                    Context: {
                        Item: document,
                        Size: undefined,
                        Position: undefined,
                    },
                    PathExpr: [
                        {
                            Function: 'root',
                            Arguments: [
                                [ {
                                    Step: {
                                        ForwardAxis: 'self',
                                        NodeTest: {
                                            AnyKindTest: [
                                                '*',
                                            ],
                                        },
                                    },
                                    PredicateList: [],
                                } ],
                            ],
                        },
                        {
                            Step: {
                                ForwardAxis: ForwardAxis['descendant-or-self'],
                                NodeTest: {
                                    AnyKindTest: [
                                        '*',
                                    ],
                                },
                            },
                            PredicateList: [],
                        },
                        {
                            Step: {
                                ForwardAxis: ForwardAxis.child,
                                NodeTest: {
                                    NameTest: 'w:p',
                                },
                            },
                            PredicateList: [
                                [ {
                                    ComparisonExpr: {
                                        Left: [ {
                                            Function: 'position',
                                            Arguments: [],
                                        } ],
                                        Right: [ {
                                            Literal: 1,
                                        } ],
                                        Operator: '=',
                                    },
                                } ],
                            ],
                        },
                        {
                            Step: {
                                ForwardAxis: ForwardAxis.child,
                                NodeTest: {
                                    NameTest: 'w:bookmarkStart',
                                },
                            },
                            PredicateList: [],
                        },
                        {
                            Step: {
                                ForwardAxis: ForwardAxis.attribute,
                                NodeTest: {
                                    NameTest: '*',
                                },
                            },
                            PredicateList: [],
                        },
                    ],
                });
                expect(ItemSequence).toHaveLength(2);
                expect(ItemSequence.map(n => n.value)).toEqual([ '_GoBack', '0' ]);
            });

            it('Should evaluate an attribute predicate', () => {
                const ItemSequence = PathExpr.evaluate({
                    Context: {
                        Item: document,
                        Size: undefined,
                        Position: undefined,
                    },
                    PathExpr: [
                        {
                            Function: 'root',
                            Arguments: [
                                [ {
                                    Step: {
                                        ForwardAxis: 'self',
                                        NodeTest: {
                                            AnyKindTest: [
                                                '*',
                                            ],
                                        },
                                    },
                                    PredicateList: [],
                                } ],
                            ],
                        },
                        {
                            Step: {
                                ForwardAxis: ForwardAxis['descendant-or-self'],
                                NodeTest: {
                                    AnyKindTest: [
                                        '*',
                                    ],
                                },
                            },
                            PredicateList: [],
                        },
                        {
                            Step: {
                                ForwardAxis: ForwardAxis.child,
                                NodeTest: {
                                    NameTest: 'w:p',
                                },
                            },
                            PredicateList: [
                                [ {
                                    ComparisonExpr: {
                                        Left: [ {
                                            Step: {
                                                ForwardAxis: ForwardAxis.attribute,
                                                NodeTest: {
                                                    NameTest: 'w14:paraId',
                                                },
                                            },
                                            PredicateList: [],
                                        } ],
                                        Right: [ {
                                            Literal: '604A9B26',
                                        } ],
                                        Operator: '=',
                                    },
                                } ],
                            ],
                        },
                    ],
                });
                expect(ItemSequence).toHaveLength(1);
                expect(ItemSequence[0]).toEqualXML(`
                    <w:p
                        xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                        w:rsidR="1065A7B4"
                        w:rsidP="1065A7B4"
                        w:rsidRDefault="1065A7B4"
                        xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
                        w14:paraId="604A9B26"
                        w14:textId="7505C1CD"
                    >
                        <w:pPr>
                            <w:pStyle w:val="Normal"/>
                        </w:pPr>
                    </w:p>
                `);
            });

            it('Should evaluate a following sibling axis and name test', () => {
                const ItemSequence = PathExpr.evaluate({
                    Context: {
                        Item: document,
                        Size: undefined,
                        Position: undefined,
                    },
                    PathExpr: [
                        {
                            Function: 'root',
                            Arguments: [
                                [ {
                                    Step: {
                                        ForwardAxis: 'self',
                                        NodeTest: {
                                            AnyKindTest: [
                                                '*',
                                            ],
                                        },
                                    },
                                    PredicateList: [],
                                } ],
                            ],
                        },
                        {
                            Step: {
                                ForwardAxis: ForwardAxis['descendant-or-self'],
                                NodeTest: {
                                    AnyKindTest: [
                                        '*',
                                    ],
                                },
                            },
                            PredicateList: [],
                        },
                        {
                            Step: {
                                ForwardAxis: ForwardAxis.child,
                                NodeTest: {
                                    NameTest: 'w:p',
                                },
                            },
                            PredicateList: [
                                [ {
                                    ComparisonExpr: {
                                        Left: [ {
                                            Function: 'position',
                                            Arguments: [],
                                        } ],
                                        Right: [ {
                                            Literal: 1,
                                        } ],
                                        Operator: '=',
                                    },
                                } ],
                            ],
                        },
                        {
                            Step: {
                                ForwardAxis: ForwardAxis.child,
                                NodeTest: {
                                    NameTest: 'w:pPr',
                                },
                            },
                            PredicateList: [],
                        },
                        {
                            Step: {
                                ForwardAxis: ForwardAxis['following-sibling'],
                                NodeTest: {
                                    NameTest: 'w:bookmarkStart',
                                },
                            },
                            PredicateList: [],
                        },
                    ],
                });
                expect(ItemSequence).toHaveLength(1);
                expect(ItemSequence[0]).toEqualXML(`
                    <w:bookmarkStart
                        xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                        w:name="_GoBack"
                        w:id="0"
                    />
                `);
            });
        });

        describe('That require parsing', () => {
            it('Should evaluate a child axis and name test', () => {
                const ItemSequence = evaluate(document, '/w:document/w:body/w:p/w:bookmarkStart');

                expect(ItemSequence).toHaveLength(1);
                expect(ItemSequence[0]).toEqualXML(`
                    <w:bookmarkStart
                        xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                        w:name="_GoBack"
                        w:id="0"
                    />
                `);
            });

            it('Should evaluate a descendant axis and name test', () => {
                const ItemSequence = evaluate(document, '//w:bookmarkStart');

                expect(ItemSequence).toHaveLength(1);
                expect(ItemSequence[0]).toEqualXML(`
                    <w:bookmarkStart
                        xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                        w:name="_GoBack"
                        w:id="0"
                    />
                `);
            });

            it('Should evaluate a position predicate', () => {
                const ItemSequence = evaluate(document, '//w:p[1]/w:bookmarkStart');

                expect(ItemSequence).toHaveLength(1);
                expect(ItemSequence[0]).toEqualXML(`
                    <w:bookmarkStart
                        xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                        w:name="_GoBack"
                        w:id="0"
                    />
                `);
            });

            it('Should evaluate an attribute axis', () => {
                const ItemSequence = evaluate(document, '//w:p[1]/w:bookmarkStart/attribute::*');

                expect(ItemSequence).toHaveLength(2);
                expect(ItemSequence.map(n => n.value)).toEqual([ '_GoBack', '0' ]);
            });

            it('Should evaluate an attribute predicate', () => {
                const ItemSequence = evaluate(document, '//w:p[@w14:paraId="604A9B26"]');

                expect(ItemSequence).toHaveLength(1);
                expect(ItemSequence[0]).toEqualXML(`
                    <w:p
                        xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                        w:rsidR="1065A7B4"
                        w:rsidP="1065A7B4"
                        w:rsidRDefault="1065A7B4"
                        xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
                        w14:paraId="604A9B26"
                        w14:textId="7505C1CD"
                    >
                        <w:pPr>
                            <w:pStyle w:val="Normal"/>
                        </w:pPr>
                    </w:p>
                `);
            });

            it('Should evaluate a following sibling axis and name test', () => {
                const ItemSequence = evaluate(
                    document, '//w:p[1]/w:pPr/following-sibling::w:bookmarkStart'
                );

                expect(ItemSequence).toHaveLength(1);
                expect(ItemSequence[0]).toEqualXML(`
                    <w:bookmarkStart
                        xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                        w:name="_GoBack"
                        w:id="0"
                    />
                `);
            });

            it('Should evaluate a relative path', () => {
                const ItemSequenceAbsolute = evaluate(
                    document, '/w:document/w:body/w:p/w:bookmarkStart'
                );

                expect(ItemSequenceAbsolute).toHaveLength(1);
                expect(ItemSequenceAbsolute[0]).toEqualXML(`
                    <w:bookmarkStart
                        xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                        w:name="_GoBack"
                        w:id="0"
                    />
                `);

                const ItemSequenceRelative = evaluate(
                    ItemSequenceAbsolute[0], './following-sibling::w:r'
                );

                expect(ItemSequenceRelative).toHaveLength(1);
                expect(ItemSequenceRelative[0]).toEqualXML(`
                    <w:r
                        xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                        w:rsidRPr="1065A7B4"
                        w:rsidR="1065A7B4"
                    >
                        <w:rPr>
                            <w:b w:val="1"/>
                            <w:bCs w:val="1"/>
                        </w:rPr>
                        <w:t>Adoration of the Magi</w:t>
                    </w:r>
                `);
            });

            it('Should evaluate a parent axis', () => {
                const ItemSequenceAbsolute = evaluate(
                    document, '/w:document/w:body/w:p/w:bookmarkStart'
                );

                expect(ItemSequenceAbsolute).toHaveLength(1);
                expect(ItemSequenceAbsolute[0]).toEqualXML(`
                    <w:bookmarkStart
                        xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                        w:name="_GoBack"
                        w:id="0"
                    />
                `);

                const ItemSequenceRelative = evaluate(
                    ItemSequenceAbsolute[0], '../following-sibling::w:p[1]'
                );

                expect(ItemSequenceRelative).toHaveLength(1);
                expect(ItemSequenceRelative[0]).toEqualXML(`
                    <w:p
                        xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                        w:rsidR="1065A7B4"
                        w:rsidP="1065A7B4"
                        w:rsidRDefault="1065A7B4"
                        xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
                        w14:paraId="604A9B26"
                        w14:textId="7505C1CD"
                    >
                        <w:pPr>
                            <w:pStyle w:val="Normal"/>
                        </w:pPr>
                    </w:p>
                `);
            });

            it('Should evaluate an ancestor axis', () => {
                const ItemSequenceAbsolute = evaluate(
                    document, '/w:document/w:body/w:p/w:bookmarkStart'
                );

                expect(ItemSequenceAbsolute).toHaveLength(1);
                expect(ItemSequenceAbsolute[0]).toEqualXML(`
                    <w:bookmarkStart
                        xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                        w:name="_GoBack"
                        w:id="0"
                    />
                `);

                const ItemSequenceRelative = evaluate(
                    ItemSequenceAbsolute[0], './ancestor::w:body/*[2]'
                );

                expect(ItemSequenceRelative).toHaveLength(1);
                expect(ItemSequenceRelative[0]).toEqualXML(`
                    <w:p
                        xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                        w:rsidR="1065A7B4"
                        w:rsidP="1065A7B4"
                        w:rsidRDefault="1065A7B4"
                        xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
                        w14:paraId="604A9B26"
                        w14:textId="7505C1CD"
                    >
                        <w:pPr>
                            <w:pStyle w:val="Normal"/>
                        </w:pPr>
                    </w:p>
                `);
            });

            it('Should evaluate a following axis', () => {
                const ItemSequenceAbsolute = evaluate(
                    document, '/w:document/w:body/w:p/w:bookmarkStart'
                );

                expect(ItemSequenceAbsolute).toHaveLength(1);
                expect(ItemSequenceAbsolute[0]).toEqualXML(`
                    <w:bookmarkStart
                        xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                        w:name="_GoBack"
                        w:id="0"
                    />
                `);

                const ItemSequenceRelative = evaluate(
                    ItemSequenceAbsolute[0], './following::w:t[../..[@w14:paraId="0DE9EC43"]]'
                );

                expect(ItemSequenceRelative).toHaveLength(1);
                expect(ItemSequenceRelative[0]).toEqualXML(`
                    <w:t
                        xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                    >On sharp objects in large pockets</w:t>
                `);
            });

            it('Should evaluate a preceding axis', () => {
                const ItemSequenceAbsolute = evaluate(
                    document, '/w:document/w:body/w:p[@w14:paraId="604A9B26"]'
                );

                expect(ItemSequenceAbsolute).toHaveLength(1);
                expect(ItemSequenceAbsolute[0]).toEqualXML(`
                    <w:p
                        xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                        w:rsidR="1065A7B4"
                        w:rsidP="1065A7B4"
                        w:rsidRDefault="1065A7B4"
                        xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"
                        w14:paraId="604A9B26"
                        w14:textId="7505C1CD"
                    >
                        <w:pPr>
                            <w:pStyle w:val="Normal"/>
                        </w:pPr>
                    </w:p>
                `);

                const ItemSequenceRelative = evaluate(
                    ItemSequenceAbsolute[0], './preceding::w:pPr'
                );

                expect(ItemSequenceRelative).toHaveLength(1);
                expect(ItemSequenceRelative[0]).toEqualXML(`
                    <w:pPr
                        xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                    >
                        <w:rPr>
                            <w:b w:val="1"/>
                            <w:bCs w:val="1"/>
                        </w:rPr>
                    </w:pPr>
                `);
            });

            it('Should evaluate an any kind test', () => {
                const ItemSequence = evaluate(
                    document, '/w:document/w:body/w:p[1]/(w:pPr|w:bookmarkStart|w:bookmarkEnd)'
                );

                expect(ItemSequence).toHaveLength(3);
                expect(ItemSequence[0]).toEqualXML(`
                    <w:pPr
                        xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                    >
                        <w:rPr>
                            <w:b w:val="1"/>
                            <w:bCs w:val="1"/>
                        </w:rPr>
                    </w:pPr>
                `);
                expect(ItemSequence[1]).toEqualXML(`
                    <w:bookmarkStart
                        xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                        w:name="_GoBack"
                        w:id="0"
                    />
                `);
                expect(ItemSequence[2]).toEqualXML(`
                    <w:bookmarkEnd
                        xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
                        w:id="0"
                    />
                `);
            });
        });
    });
});