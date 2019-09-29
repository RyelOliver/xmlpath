# xmlpath
A basic implementation of the [XML Path Language (XPath) 3.1](https://www.w3.org/TR/xpath-31/) abbreviated syntax, [functions and operators](https://www.w3.org/TR/xpath-functions-31/). An excerpt from the specification:

## Path Expressions
[Definition: A path expression can be used to locate nodes within trees. A path expression consists of a series of one or more steps, separated by "/" or "//", and optionally beginning with "/" or "//".] An initial "/" or "//" is an abbreviation for one or more initial steps that are implicitly added to the beginning of the path expression, as described below.

A path expression consisting of a single step is evaluated as described in 3.3.2 Steps.

A "/" at the beginning of a path expression is an abbreviation for the initial step (fn:root(self::node()) treat as document-node())/ (however, if the "/" is the entire path expression, the trailing "/" is omitted from the expansion.) The effect of this initial step is to begin the path at the root node of the tree that contains the context node. If the context item is not a node, a type error is raised [err:XPTY0020]. At evaluation time, if the root node of the context node is not a document node, a dynamic error is raised [err:XPDY0050].

A "//" at the beginning of a path expression is an abbreviation for the initial steps (fn:root(self::node()) treat as document-node())/descendant-or-self::node()/ (however, "//" by itself is not a valid path expression [err:XPST0003].) The effect of these initial steps is to establish an initial node sequence that contains the root of the tree in which the context node is found, plus all nodes descended from this root. This node sequence is used as the input to subsequent steps in the path expression. If the context item is not a node, a type error is raised [err:XPTY0020]. At evaluation time, if the root node of the context node is not a document node, a dynamic error is raised [err:XPDY0050].

Note:

The descendants of a node do not include attribute nodes or namespace nodes.

A path expression that starts with "/" or "//" selects nodes starting from the root of the tree containing the context item; it is often referred to as an absolute path expression.

### Relative Path Expressions
A relative path expression is a path expression that selects nodes within a tree by following a series of steps starting at the context node (which, unlike an absolute path expression, may be any node in a tree).

Each non-initial occurrence of "//" in a path expression is expanded as described in 3.3.5 Abbreviated Syntax, leaving a sequence of steps separated by "/". This sequence of steps is then evaluated from left to right. So a path such as E1/E2/E3/E4 is evaluated as ((E1/E2)/E3)/E4. The semantics of a path expression are thus defined by the semantics of the binary "/" operator, which is defined in 3.3.1.1 Path operator (/).

Note:

Although the semantics describe the evaluation of a path with more than two steps as proceeding from left to right, the "/" operator is in most cases associative, so evaluation from right to left usually delivers the same result. The cases where "/" is not associative arise when the functions fn:position() and fn:last() are used: A/B/position() delivers a sequence of integers from 1 to the size of (A/B), whereas A/(B/position()) restarts the counting at each B element.

### Abbreviated Syntax
The abbreviated syntax permits the following abbreviations:

The attribute axis attribute:: can be abbreviated by @. For example, a path expression para[@type="warning"] is short for child::para[attribute::type="warning"] and so selects para children with a type attribute with value equal to warning.

If the axis name is omitted from an axis step, the default axis is child, with two exceptions: (1) if the NodeTest in an axis step contains an AttributeTest or SchemaAttributeTest then the default axis is attribute; (2) if the NodeTest in an axis step is a NamespaceNodeTest then the default axis is namespace - in an implementation that does not support the namespace axis, an error is raised [err:XQST0134].

Note:

The namespace axis is deprecated as of XPath 2.0, but required in some languages that use XPath, including XSLT.

For example, the path expression section/para is an abbreviation for child::section/child::para, and the path expression section/@id is an abbreviation for child::section/attribute::id. Similarly, section/attribute(id) is an abbreviation for child::section/attribute::attribute(id). Note that the latter expression contains both an axis specification and a node test.

Each non-initial occurrence of // is effectively replaced by /descendant-or-self::node()/ during processing of a path expression. For example, div1//para is short for child::div1/descendant-or-self::node()/child::para and so will select all para descendants of div1 children.

Note:

The path expression //para[1] does not mean the same as the path expression /descendant::para[1]. The latter selects the first descendant para element; the former selects all descendant para elements that are the first para children of their respective parents.

A step consisting of .. is short for parent::node(). For example, ../title is short for parent::node()/child::title and so will select the title children of the parent of the context node.

Note:

The expression ., known as a context item expression, is a primary expression, and is described in 3.1.4 Context Item Expression.