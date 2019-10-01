const XML = require('@ryel/xml');

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

function toString (node) {
    return XML.prettify(node.toString());
}

module.exports = {
    NodeType,
    toString,
};