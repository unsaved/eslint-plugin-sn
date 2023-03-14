"use strict";

const message = "Avoid use of client-side GlideRecord in favor of more efficient alternatives";
const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();
const esLintObj = {
    meta: {
        type: "suggestion",
        docs: {
            description:
              'g_scratchpad, AJAX, et. al. are more efficient than client-side GlideRecord',
            category: "Suggestions",
        },
        messages: { },
    },

    create: context => {
        return {
            NewExpression: (node) => {
                if (node.callee && node.callee.type === "Identifier"
                  && node.callee.name === "GlideRecord")
                    context.report({node, messageId});
            },
        };
    }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
