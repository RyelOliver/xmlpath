const NodeType = {
    Element: 1,
    Attribute: 2,
    Text: 3,
    CDATASection: 4,
    EntityRef: 5,
    Entity: 6,
    PI: 7,
    Comment: 8,
    Document: 9,
    DocumentType: 10,
    DocumentFragment: 11,
    Notation: 12,
};

function isBoolean (value) {
    return typeof value === 'boolean';
}

function isNumber (value) {
    return typeof value === 'number';
}

function isString (value) {
    return typeof value === 'string';
}

function isSingleLengthArray (value) {
    return Array.isArray(value) && value.length === 1;
}

// function isNode (value) {
//     return typeof value === 'object' && value.nodeType !== undefined;
// }

function isNameStartChar (Char) {
    // TODO: add unicodes
    return /[:A-Z_a-z]/.test(Char);
}

function isNameChar (Char) {
    // TODO: add unicodes
    return isNameStartChar(Char) || /[-.0-9]/.test(Char);
}

function isName (Name) {
    return isNameStartChar(Name[0]) && Name.substring(1).split('').every(isNameChar);
}

function isNameOrWildcard (Name) {
    return Name === '*' || isName(Name);
}

function throwIfNotNameOrWildcard (Name) {
    if (!isNameOrWildcard(Name))
        throw Error(`${Name} is an invalid name.`);
}

const Node = {
    childNodes: function (node) {
        return node.childNodes ? Array.from(node.childNodes) : [];
    },
    descendantNodes: function (node) {
        return Node.childNodes(node).reduce((descendantNodes, node) => {
            return descendantNodes
                .concat([ node ])
                .concat(Node.descendantNodes(node));
        }, []);
    },
    ancestorNodes: function (node) {
        return node.parentNode ?
            [ node.parentNode, ...Node.ancestorNodes(node.parentNode) ] :
            [];
    },
    followingSiblings: function (node) {
        return node.nextSibling ?
            [ node.nextSibling, ...Node.followingSiblings(node.nextSibling) ] :
            [];
    },
    precedingSiblings: function (node) {
        return node.previousSibling ?
            [ node.previousSibling, ...Node.precedingSiblings(node.previousSibling) ] :
            [];
    },
    following: function (node) {
        // Get all following siblings
        const followingSiblings = Node.followingSiblings(node);
        // Get all their descendants
        const followingDescendants = followingSiblings.reduce((following, sibling) => {
            return following.concat([ sibling, ...Node.descendantNodes(sibling) ]);
        }, []);
        // Get parent (excluded)
        return node.parentNode ?
            followingDescendants.concat(Node.following(node.parentNode)) :
            followingDescendants;
    },
    preceding: function (node) {
        // Get all preceding siblings
        const precedingSiblings = Node.precedingSiblings(node);
        // Get all their descendants
        const precedingDescendants = precedingSiblings.reduce((preceding, sibling) => {
            return preceding.concat([ sibling, ...Node.descendantNodes(sibling) ].reverse());
        }, []);
        // Get parent (excluded)
        return node.parentNode ?
            precedingDescendants.concat(Node.preceding(node.parentNode)) :
            precedingDescendants;
    },
};

// TODO: apply document order to the final result of each step
// function documentOrder (ItemSequence) {
//     return ItemSequence.sort((ItemA, ItemB) => {
//         if (!isNode(ItemA) || !isNode(ItemB))
//             return 0;

//         // How do we know whether A is before B?
//     });
// }

/*
When using predicates with a sequence of nodes selected using a reverse axis,
it is important to remember that the context positions for such a sequence
are assigned in reverse document order. For example,
preceding::foo[1] returns the first qualifying foo element in reverse document order,
because the predicate is part of an axis step using a reverse axis. By contrast,
(preceding::foo)[1] returns the first qualifying foo element in document order,
because the parentheses cause (preceding::foo) to be parsed as a primary expression
in which context positions are assigned in document order. Similarly,
ancestor::*[1] returns the nearest ancestor element,
because the ancestor axis is a reverse axis, whereas
(ancestor::*)[1] returns the root element (first ancestor in document order).

The fact that a reverse-axis step assigns context positions in reverse document order
for the purpose of evaluating predicates does not alter the fact that the final result of the step
is always in document order.
*/

const ValueComp = {
    eq: 'eq',
    ne: 'ne',
    lt: 'lt',
    le: 'le',
    gt: 'gt',
    ge: 'ge',
};

const GeneralComp = {
    '=': '=',
    '!=': '!=',
    '<': '<',
    '<=': '<=',
    '>': '>',
    '>=': '>=',
};

const NodeComp = {
    is: 'is',
    '<<': '<<',
    '>>': '>>',
};

const Op = {
    or: 'or',
    and: 'and',
};

const Wildcard = '*';

const ForwardAxis = {
    child: 'child',
    descendant: 'descendant',
    attribute: 'attribute',
    self: 'self',
    'descendant-or-self': 'descendant-or-self',
    'following-sibling': 'following-sibling',
    following: 'following',
    namespace: 'namespace',
};

const ReverseAxis = {
    parent: 'parent',
    ancestor: 'ancestor',
    'preceding-sibling': 'preceding-sibling',
    preceding: 'preceding',
    'ancestor-or-self': 'ancestor-or-self',
};

// interface Step {
//     NodeTest: KindTest | NameTest;
// }

// interface ForwardStep extends Step {
//     ForwardAxis: ForwardAxis;
// }

// interface ReverseStep extends Step {
//     ReverseAxis: ReverseAxis;
// }

// interface AxisStep {
//     Step: ForwardStep | ReverseStep;
//     PredicateList: Predicate[];
// }

// interface Context {
//     Item; // item currently being tested
//     Position?: number; // position of the item in the input sequence
//     Size?: number; // number of items in the input sequence
// }

const Fn = {
    // Boolean
    true: function () {
        return true;
    },
    false: function () {
        return false;
    },
    boolean: function (value) {
        if (Array.isArray(value))
            return value.length > 0;

        if (isBoolean(value))
            return value;

        if (isString(value))
            return value.length > 0;

        if (isNumber(value))
            return isNaN(value) || value === 0 ? false : true;

        throw TypeError('Invalid argument type.');
    },
    not: function (value) {
        return !Fn.boolean(value);
    },
    // Number
    abs: function () {
        throw Error('Function unimplemented.');
    },
    ceiling: function () {
        throw Error('Function unimplemented.');
    },
    floor: function () {
        throw Error('Function unimplemented.');
    },
    // String
    concat: function (_, ...args) {
        return args.join('');
    },
    substring: function (_, string, start, length) {
        start = Math.round(start);
        if (length === undefined)
            return string.substring(start);

        length = Math.round(length);
        return string.substring(start, start + length);
    },
    'upper-case': function (_, string) {
        return string.toUpperCase();
    },
    'lower-case': function (_, string) {
        return string.toLowerCase();
    },
    contains: function (_, string, substring) {
        return string.includes(substring);
    },
    'starts-with': function (_, string, substring) {
        return string.startsWith(substring);
    },
    'ends-with': function (_, string, substring) {
        return string.endsWith(substring);
    },
    // Node
    name: function () {
        throw Error('Function unimplemented.');
    },
    root: function (Context, node = Context.Item) {
        if (Array.isArray(node))
            node = node[0];

        // TODO: should really be able to evaluate (/ancestor-or-self::node())[1],
        // but that requires implementing document order sorting
        // TODO: xmldom provides node.ownerDocument as a shortcut
        const XPathResult = evaluate(node, 'ancestor-or-self::node()[fn:last()]')[0];
        if (!XPathResult || XPathResult.nodeType !== NodeType.Document)
            throw Error('The root node is not a document node. [err:XPDY0050]');

        return XPathResult;
    },
    path: function () {
        throw Error('Function unimplemented.');
    },
    'has-children': function () {
        throw Error('Function unimplemented.');
    },
    // Context
    position: function (Context) {
        return Context.Position;
    },
    last: function (Context) {
        return Context.Size;
    },
};

const Scope = {
    Round: 0,
    Square: 1,
    Curly: 2,
    DoubleQuote: 3,
    Start: [
        '(',
        '[',
        '{',
        '"',
    ],
    End: [
        ')',
        ']',
        '}',
        '"',
    ],
    inCurrent: function (string, indexTest) {
        let index = 0;
        const scope = Scope.Start.reduce((scope, _, key) => {
            scope[key] = 0;
            return scope;
        }, {});

        const currentScope = () => {
            return Object.values(scope).every(scopeType => scopeType === 0);
        };

        while (index < indexTest && index < string.length) {
            const char = string[index];

            if (char === Scope.Start[Scope.DoubleQuote]) {
                const scopeType = Scope.Start.indexOf(char);
                scope[scopeType] === 0 ?
                    scope[scopeType]++ :
                    scope[scopeType]--;
            } else if (Scope.Start.includes(char)) {
                const scopeType = Scope.Start.indexOf(char);
                scope[scopeType]++;
            } else if (Scope.End.includes(char)) {
                const scopeType = Scope.End.indexOf(char);
                scope[scopeType]--;
            }

            index++;
        }

        return currentScope();
    },
    indexOfClosing: function (string, scopeChar) {
        const scope = Scope.Start.reduce((scope, _, key) => {
            scope[key] = 0;
            return scope;
        }, {});

        const currentScope = () => {
            return Object.values(scope).every(scopeType => scopeType === 0);
        };

        let index = 1;
        while (index < string.length) {
            const char = string[index];

            if (char === Scope.Start[Scope.DoubleQuote]) {
                if (char === Scope.End[scopeChar] && currentScope()) {
                    return index;
                } else {
                    const scopeType = Scope.Start.indexOf(char);
                    scope[scopeType] === 0 ?
                        scope[scopeType]++ :
                        scope[scopeType]--;
                }
            } else if (Scope.Start.includes(char)) {
                const scopeType = Scope.Start.indexOf(char);
                scope[scopeType]++;
            } else if (Scope.End.includes(char)) {
                if (char === Scope.End[scopeChar] && currentScope()) {
                    return index;
                } else {
                    const scopeType = Scope.End.indexOf(char);
                    scope[scopeType]--;
                }
            }

            index++;
        }

        return -1;
    },
    unwrap: function (input, scopeType) {
        if (input[0] === Scope.Start[scopeType] &&
            Scope.indexOfClosing(input, scopeType) === input.length - 1)
            return input.substring(1, input.length - 1);

        return input;
    },
};

const Expr = {
    evaluate: function (args) {
        const {
            Context,
            Literal,
            OrExpr,
            AndExpr,
            ComparisonExpr,
            Function,
            Arguments,
            Step,
            PrimaryExpr,
            PredicateList,
        } = args;

        if (Literal !== undefined)
            return Literal;

        if (OrExpr || AndExpr || ComparisonExpr) {
            const Expr = { ...OrExpr, ...AndExpr, ...ComparisonExpr };
            const { Left, Right, Operator } = Expr;

            let left = PathExpr.evaluate({ Context, PathExpr: Left });
            let right = PathExpr.evaluate({ Context, PathExpr: Right });

            if (OrExpr || AndExpr) {
                const bool = OrExpr ?
                    left || right :
                    left && right;
                return Fn.boolean(bool);
            }

            if (Array.isArray(left))
                left = left[0];
            if (Array.isArray(right))
                right = right[0];

            if (left && left.nodeType === NodeType.Attribute)
                left = left.value;
            if (right && right.nodeType === NodeType.Attribute)
                right = right.value;

            if (typeof right === 'number' && typeof left !== 'number')
                left = parseFloat(left);
            if (typeof left === 'number' && typeof right !== 'number')
                right = parseFloat(right);

            switch (Operator) {
                case GeneralComp['=']:
                    return left === right;
                case GeneralComp['!=']:
                    return left !== right;
                case GeneralComp['<']:
                    return left < right;
                case GeneralComp['<=']:
                    return left <= right;
                case GeneralComp['>']:
                    return left > right;
                case GeneralComp['>=']:
                    return left >= right;
                default:
                    throw Error('Unknown comparison operator.');
            }
        }

        let ItemSequence = [ Context.Item ];

        if (Function) {
            if (!Fn[Function])
                throw Error('Function does not exist.');

            const args = Arguments.map(arg => PathExpr.evaluate({ Context, PathExpr: arg }));
            ItemSequence = [ Fn[Function](Context, ...args) ];
        }

        if (Step) {
            const { NodeTest } = Step;
            if ('ForwardAxis' in Step) {
                switch (Step.ForwardAxis) {
                    case ForwardAxis.child:
                        ItemSequence = Node.childNodes(Context.Item);
                        break;
                    case ForwardAxis.descendant:
                        ItemSequence = Node.descendantNodes(Context.Item);
                        break;
                    case ForwardAxis.attribute:
                        ItemSequence = Array.from(Context.Item.attributes);
                        break;
                    case ForwardAxis.self:
                        break;
                    case ForwardAxis['descendant-or-self']:
                        ItemSequence = [ Context.Item ].concat(Node.descendantNodes(Context.Item));
                        break;
                    case ForwardAxis['following-sibling']:
                        ItemSequence = Node.followingSiblings(Context.Item);
                        break;
                    case ForwardAxis.following:
                        ItemSequence = Node.following(Context.Item);
                        break;
                    // case ForwardAxis.namespace:
                    //     ItemSequence = [];
                    //     break;
                    default:
                        throw Error(`${Step.ForwardAxis} is an unknown axis.`);
                }
            } else if ('ReverseAxis' in Step) {
                switch (Step.ReverseAxis) {
                    case ReverseAxis.parent:
                        ItemSequence = Context.Item.parentNode ?
                            [ Context.Item.parentNode ] :
                            [];
                        break;
                    case ReverseAxis.ancestor:
                        ItemSequence = Node.ancestorNodes(Context.Item);
                        break;
                    case ReverseAxis['preceding-sibling']:
                        ItemSequence = Node.precedingSiblings(Context.Item);
                        break;
                    case ReverseAxis.preceding:
                        ItemSequence = Node.preceding(Context.Item);
                        break;
                    case ReverseAxis['ancestor-or-self']:
                        ItemSequence = [ Context.Item ].concat(Node.ancestorNodes(Context.Item));
                        break;
                    default:
                        throw Error(`${Step.ReverseAxis} is an unknown axis.`);
                }
            }

            if ('ElementTest' in NodeTest) {
                const elementName = NodeTest.ElementTest || Wildcard;
                ItemSequence = ItemSequence.filter(Item => {
                    return Item.nodeType === NodeType.Element &&
                        Item.nodeName === elementName;
                });

            } else if ('AttributeTest' in NodeTest) {
                const attributeName = NodeTest.AttributeTest || Wildcard;
                ItemSequence = ItemSequence.filter(Item => {
                    return Item.nodeType === NodeType.Attribute &&
                        Item.nodeName === attributeName;
                });

            } else if ('AnyKindTest' in NodeTest) {
                const AnyKindTest = NodeTest.AnyKindTest || [];
                if (AnyKindTest.length > 0 && !AnyKindTest.includes(Wildcard))
                    ItemSequence = ItemSequence.filter(Item => {
                        return AnyKindTest.includes(Item.nodeName);
                    });

            } else if ('NameTest' in NodeTest) {
                const name = NodeTest.NameTest || Wildcard;
                if (name !== Wildcard)
                    ItemSequence = ItemSequence.filter(Item => {
                        return Item.nodeName === name;
                    });

            }
        }

        if (PrimaryExpr) {
            ItemSequence = PathExpr.evaluate({ Context, PathExpr: PrimaryExpr });
        }

        if (PredicateList && PredicateList.length > 0) {
            PredicateList.forEach(PathExpr => {
                Context.Size = ItemSequence.length;
                ItemSequence = ItemSequence.filter((Item, Index) => {
                    return Predicate.evaluate({
                        Context: {
                            Item,
                            Position: Index + 1,
                            Size: Context.Size,
                        },
                        PathExpr,
                    });
                });
            });
        }

        return ItemSequence;
    },
};

const Predicate = {
    evaluate: function (args) {
        let XPathResult = PathExpr.evaluate(args);

        if (isSingleLengthArray(XPathResult) &&
        (isBoolean(XPathResult[0]) || isNumber(XPathResult[0]) || isString(XPathResult[0])))
            XPathResult = XPathResult[0];

        if (Number.isInteger(XPathResult))
            return args.Context.Position === XPathResult;

        return Fn.boolean(XPathResult);
    },
};

function isAxis (StepExpr, { category, name, syntax = `${name}::`, substring = syntax }) {
    const AxisCategory = category === 'ForwardAxis' ? ForwardAxis : ReverseAxis;
    const Axis = { [category]: AxisCategory[name] };

    if (StepExpr.startsWith(syntax)) {
        StepExpr = StepExpr.substring(substring.length);
        return { Axis, StepExpr };
    }

    if (StepExpr.startsWith(`/${syntax}`)) {
        StepExpr = StepExpr.substring(`/${substring}`.length);
        return { Axis, StepExpr };
    }
}

function parseAxis (StepExpr) {
    const Axes = [
        { category: 'ForwardAxis', name: 'self' },
        { category: 'ForwardAxis', name: 'child' },
        { category: 'ForwardAxis', name: 'descendant' },
        { category: 'ForwardAxis', name: 'descendant-or-self' },
        { category: 'ForwardAxis', name: 'following' },
        { category: 'ForwardAxis', name: 'following-sibling' },
        { category: 'ForwardAxis', name: 'attribute' },
        { category: 'ForwardAxis', name: 'attribute', syntax: '@' },
        { category: 'ForwardAxis', name: 'attribute', syntax: 'attribute(', substring: '' },
        { category: 'ReverseAxis', name: 'parent' },
        { category: 'ReverseAxis', name: 'ancestor' },
        { category: 'ReverseAxis', name: 'ancestor-or-self' },
        { category: 'ReverseAxis', name: 'preceding' },
        { category: 'ReverseAxis', name: 'preceding-sibling' },
    ];

    let index = 0;
    while (index < Axes.length) {
        const match = isAxis(StepExpr, Axes[index]);
        if (match)
            return { ...match };
        index++;
    }

    return {
        Axis: { ForwardAxis: ForwardAxis.child },
        StepExpr: StepExpr.startsWith('/') ? StepExpr.substring('/'.length) : StepExpr,
    };
}

const StepExpr = {
    first: function (PathExpr) {
        const index = PathExpr.search(/\//);
        if (index < 0)
            return PathExpr;

        const scope = Scope.Start.reduce((scope, _, key) => {
            scope[key] = 0;
            return scope;
        }, {});

        const currentScope = () => {
            return Object.values(scope).every(scopeType => scopeType === 0);
        };

        let end = 0;

        while (end < PathExpr.length - 1) {
            const char = PathExpr[end];

            if (char === Scope.Start[Scope.DoubleQuote]) {
                const scopeType = Scope.Start.indexOf(char);
                scope[scopeType] === 0 ?
                    scope[scopeType]++ :
                    scope[scopeType]--;
            } else if (Scope.Start.includes(char)) {
                const scopeType = Scope.Start.indexOf(char);
                scope[scopeType]++;

            } else if (Scope.End.includes(char)) {
                const scopeType = Scope.End.indexOf(char);
                scope[scopeType]--;

            } else if (end > 0 && char === '/' && currentScope()) {
                return PathExpr.substring(0, end);
            }

            end++;
        }

        return PathExpr;
    },
    split: function (PathExpr) {
        const StepExprList = [];

        if (!PathExpr.includes('/'))
            StepExprList.push(PathExpr);

        while (PathExpr.includes('/')) {
            const stepExpr = StepExpr.first(PathExpr);
            StepExprList.push(stepExpr);
            PathExpr = PathExpr.substring(stepExpr.length);
        }

        return StepExprList;
    },
    parse: function (stepExpr) {
        const trim = () => stepExpr = stepExpr.trim();
        trim();

        if (stepExpr === '')
            throw Error('A path expression is required.');

        if (stepExpr === '.')
            return [ { ContextItemExpr: true } ];

        if (stepExpr.match(/^(\d+)$/))
            return [ { Literal: parseInt(stepExpr) } ];

        if (stepExpr.match(/^(\.\d+|\d+.\d+)$/))
            return [ { Literal: parseFloat(stepExpr) } ];

        if (stepExpr !== Scope.unwrap(stepExpr, Scope.DoubleQuote)) {
            return [ { Literal: Scope.unwrap(stepExpr, Scope.DoubleQuote) } ];
        }

        const PredicateList = [];
        if (stepExpr !== Scope.unwrap(stepExpr, Scope.Round)) {
            const PrimaryExpr = StepExpr.split(Scope.unwrap(stepExpr, Scope.Round))
                .reduce(StepExpr.parseDeep, []);

            return {
                PrimaryExpr,
                PredicateList,
            };
        }

        const or = ` ${Op.or} `;
        const indexOr = stepExpr.indexOf(or);
        if (indexOr >= 0 && Scope.inCurrent(stepExpr, indexOr)) {
            let Left;
            let Right;

            try {
                Left = PathExpr.parse(stepExpr.substring(0, indexOr));
                Right = PathExpr.parse(stepExpr.substring(indexOr + or.length));
            } catch (error) {
                throw Error(`${stepExpr} is an invalid path expression.`);
            }

            return [ { OrExpr: { Left, Right } } ];
        }

        const and = ` ${Op.and} `;
        const indexAnd = stepExpr.indexOf(and);
        if (indexAnd >= 0 && Scope.inCurrent(stepExpr, indexAnd)) {
            let Left;
            let Right;

            try {
                Left = PathExpr.parse(stepExpr.substring(0, indexAnd));
                Right = PathExpr.parse(stepExpr.substring(indexAnd + and.length));
            } catch (error) {
                throw Error(`${stepExpr} is an invalid path expression.`);
            }

            return [ { AndExpr: { Left, Right } } ];
        }

        const generalComp = Object.values(GeneralComp);
        const regExp = new RegExp(`(${generalComp.join('|')})`);
        const indexOp = stepExpr.search(regExp);
        if (indexOp >= 0 && Scope.inCurrent(stepExpr, indexOp)) {
            let Operator = stepExpr.substring(indexOp, indexOp + 2);
            if (!generalComp.includes(Operator)) {
                Operator = stepExpr.substring(indexOp, indexOp + 1);
            }

            let Left;
            let Right;

            try {
                Left = PathExpr.parse(stepExpr.substring(0, indexOp));
                Right = PathExpr.parse(stepExpr.substring(indexOp + Operator.length));
            } catch (error) {
                throw Error(`${stepExpr} is an invalid path expression.`);
            }

            return [ {
                ComparisonExpr: { Left, Right, Operator },
            } ];
        }

        while (stepExpr.indexOf(Scope.Start[Scope.Square]) >= 0) {
            const indexStart = stepExpr.indexOf(Scope.Start[Scope.Square]);
            let indexEnd = Scope.indexOfClosing(stepExpr.substring(indexStart), Scope.Square);
            if (indexEnd < 0)
                throw Error('No closing ] found.');

            indexEnd += indexStart;

            const predicate = PathExpr.parse(stepExpr.substring(indexStart + 1, indexEnd));
            PredicateList.push(predicate);

            const nextChar = stepExpr[indexEnd + 1];
            if (nextChar && nextChar !== Scope.Start[Scope.Square])
                throw Error('Only additional steps can be added after a predicate.');

            stepExpr = `${stepExpr.substring(0, indexStart)}${stepExpr.substring(indexEnd + 1)}`;
        }

        if (stepExpr !== Scope.unwrap(stepExpr, Scope.Round)) {
            const PrimaryExpr = StepExpr.split(Scope.unwrap(stepExpr, Scope.Round))
                .reduce(StepExpr.parseDeep, []);

            return {
                PrimaryExpr,
                PredicateList,
            };
        }

        if (stepExpr.startsWith('fn:') || stepExpr.startsWith('/fn:')) {
            const match = stepExpr.match(/fn:(.*?)\(/);
            const Function = match[1];

            // TODO: handle expressions after function,
            // e.g. fn:root(self::node()) treat as document-node()
            const indexStart = match.index + `fn:${Function}`.length;
            let indexEnd = Scope.indexOfClosing(stepExpr.substring(indexStart), Scope.Round);
            if (indexEnd < 0)
                throw Error('No closing ) found.');

            indexEnd += indexStart;

            const args = stepExpr.substring(indexStart+1, indexEnd)
                .split(',');
            const Arguments = args.length === 1 && !args[0] ? [] : args.map(PathExpr.parse);

            return [ {
                Function,
                Arguments,
                PredicateList,
            } ];
        }

        let Axis;
        ({ Axis, StepExpr: stepExpr } = parseAxis(stepExpr));

        const NodeTest = {};
        if (stepExpr.match(/^element\((.*?)\)$/)) {
            const name = stepExpr.match(/^element\((.*?)\)$/)[1] || Wildcard;
            throwIfNotNameOrWildcard(name);
            NodeTest.ElementTest = name;
        } else if (stepExpr.match(/^attribute\((.*?)\)$/)) {
            const name = stepExpr.match(/^attribute\((.*?)\)$/)[1] || Wildcard;
            throwIfNotNameOrWildcard(name);
            NodeTest.AttributeTest = name;
        } else if (stepExpr === 'node()') {
            NodeTest.AnyKindTest = [ Wildcard ];
        } else if (stepExpr.includes('|')) {
            stepExpr = Scope.unwrap(stepExpr, Scope.Round);
            const nameList = stepExpr.split('|');
            nameList.every(throwIfNotNameOrWildcard);
            NodeTest.AnyKindTest = nameList;
        } else {
            const name = stepExpr || Wildcard;
            throwIfNotNameOrWildcard(name);
            NodeTest.NameTest = name;
        }

        return [ {
            Step: {
                ...Axis,
                NodeTest,
            },
            PredicateList,
        } ];
    },
    parseDeep: (stepList, step) => stepList.concat(StepExpr.parse(step)),
};

const ROOT_EXPR = '(fn:root(self::node()) treat as document-node())';
const DESCENDANT_EXPR = '/descendant-or-self::node()/';
const PARENT_EXPR = 'parent::node()';

const PathExpr = {
    replace: function (PathExpr) {
        if (PathExpr === '/')
            return ROOT_EXPR;

        if (PathExpr === '//')
            throw Error('// is an invalid path expression. [err:XPST0003]');

        let replacedInitialOccurence = PathExpr;
        if (PathExpr.substring(0, 2) === '//') {
            replacedInitialOccurence = PathExpr
                .replace('//', `${ROOT_EXPR}${DESCENDANT_EXPR}`);
        } else if (PathExpr[0] === '/') {
            replacedInitialOccurence = PathExpr
                .replace('/', `${ROOT_EXPR}/`);
        }

        const replacedDescendantAxis = replacedInitialOccurence
            .replace(/\/\//g, `${DESCENDANT_EXPR}`);
        const replacedParentAxis = replacedDescendantAxis
            .replace(/\.\./g, PARENT_EXPR);

        return replacedParentAxis;
    },
    parse: function (pathExpr) {
        return StepExpr.split(PathExpr.replace(pathExpr))
            .reduce(StepExpr.parseDeep, []);
    },
    evaluate: function ({ Context, PathExpr }) {
        let ItemSequence = [ Context.Item ];
        PathExpr.forEach(StepExpr => {
            // Context.Size = ItemSequence.length;

            ItemSequence = ItemSequence.reduce((ItemSequence, Item) => {
                const result = Expr.evaluate({
                    Context: {
                        ...Context,
                        Item,
                    },
                    ...StepExpr,
                });
                return ItemSequence.concat(result);
            }, []);
        });
        return ItemSequence;
    },
};

function evaluate (Item, pathExpr) {
    return PathExpr.evaluate({
        Context: { Item, Position: 1, Size: 1 },
        PathExpr: PathExpr.parse(pathExpr),
    });
}

module.exports = {
    Wildcard,
    Op,
    ValueComp,
    GeneralComp,
    NodeComp,
    ForwardAxis,
    ReverseAxis,
    Fn,
    Scope,
    Predicate,
    PathExpr,
    evaluate,
};