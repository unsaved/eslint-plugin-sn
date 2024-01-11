"use strict";

/**
 * This is just like OOTB rule class-methods-use-this, but that is only for ES6
 */

const strip = require("strip-comments");

const message = "Prototype function should use 'this'.  Otherwise implement ClassName.functionName";

const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();
const esLintObj = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Platform-provided template comments are not for production",
            category: "Suggestions",
        },
        messages: { },
    },

    create: context => { return {
        FunctionExpression: node => {
            switch (node.parent.type) {
                case "Property":
                    if (node.parent.parent.type !== "ObjectExpression") return;
                    if (node.parent.parent.parent.type !== "AssignmentExpression") return;
                    if (node.parent.parent.parent.left.type !== "MemberExpression") return;
                    if (node.parent.parent.parent.left.property.type !== "Identifier") return;
                    if (node.parent.parent.parent.left.property.name !== "prototype") return;
                    if (!/\bthis\b/.test(strip(context.getSourceCode().getText(node.body))))
                        context.report({node, messageId});
                    break;
                case "AssignmentExpression":
                    if (node.parent.left.type !== "MemberExpression") return;
                    if (node.parent.left.object.type !== "MemberExpression") return;
                    if (node.parent.left.object.property.type !== "Identifier") return;
                    if (node.parent.left.object.property.name !== "prototype") return;
                    if (!/\bthis\b/.test(strip(context.getSourceCode().getText(node.body))))
                        context.report({node, messageId});
                    break;
                // Purposefully no default
            }
        }
    }; }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
