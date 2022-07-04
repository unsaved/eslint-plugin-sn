"use strict";

const message =
  "Use an association to a field value meaningful to humans rather than hardcoded sys_id";
// eslint-disable-next-line prefer-template
const msgKey = (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();
const esLintObj = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Don't hard-code sys_ids",
            category: "Suggestions",
        },
        schema: [ ],
        messages: { },
    },

    create: context => {  // Called once for the source file
        return { Literal(node) {
            if (/^[\da-f]{32}$/i.test(node.value))
                context.report({node, messageId: msgKey});
        } };
    }
};
esLintObj.meta.messages[msgKey] = message;
module.exports = esLintObj;
