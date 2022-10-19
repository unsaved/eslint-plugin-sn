"use strict";

const message = "Use 'now GlideDate().getDisplayValue()' instead of deprecated 'gs.now()'";
const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();
const esLintObj = {
    meta: {
        type: "problem",
        docs: {
            description: 'gs.now() is no longer supported as of the London release',
            category: "Possible Problems",
        },
        messages: { },
    },

    create: context => {
        return {
            CallExpression: (node) => {
                if (node.callee && node.callee.object && node.callee.property
                  && node.callee.object.type === "Identifier"
                  && node.callee.property.type === "Identifier"
                  && node.callee.object.name === "gs"
                  && node.callee.property.name === "now")
                    context.report({node, messageId});
            },
        };
    }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
