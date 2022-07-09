"use strict";

const message = "Don't use empty string to indicate 'unset'.  That's what undefined is for.";
const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();
const esLintObj = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Init to empty string is usually (but not always) a mistake",
            category: "Suggestions",
        },
        messages: { },
    },

    create: context => { return {
        Literal(node) {
            if (node.value === "" && node.parent.type === "VariableDeclarator"
              && node.parent.parent.kind !== "const")
                context.report({node, messageId});
        }
    }; }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
