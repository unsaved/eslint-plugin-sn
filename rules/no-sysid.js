"use strict";

const message =
  "Use dot-walking instead of har-coded sysids.  E.g.: if (task.assignment_group_name.name ===...";
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
