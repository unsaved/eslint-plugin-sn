"use strict";

const message =
  "Use dot-walking instead of hard-coded sysids like 'if (task.assigned_to.user_name ===...";
const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();
const esLintObj = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Don't hard-code sys_ids",
            category: "Suggestions",
        },
        messages: { },
    },

    create: context => { return {
        Literal(node) {
            if (/^[\da-f]{32}$/i.test(node.value))
                context.report({node, messageId});
        }
    }; }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
