"use strict";

/**
 * This is a no-op.  TODO:
 * It will take a lot of work, but to detect IIFE, copy function 'getFunctionNodeFromIIFE' and
 * all dependency modules for that, from "node_modules/eslint/lib/rules/wrap-iife.js".
 */

const message =
  "Consider wrapping your code body in an IIFE to protect against ServiceNow variable scope leak";
// eslint-disable-next-line prefer-template
const msgKey = (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();
const esLintObj = {
    meta: {
        type: "problem",
        docs: {
            description:
              "Many ServiceNow scriptlet types need an IIFE to protect from variable scope leaks",
            category: "Possible Problems",
            recommended: true
        },
        schema: [ ],
        messages: { },
    },

    /**
     *  Dummy implementation.  See TODO Note above.
     */
    create: context => {  // Called once for the source file
        return { CallExpression: node => {  // Called for every function call expression
            const callee = node.callee;
            if (callee.type !== "MemberExpression" || callee.object.name !== "gs") return;
            switch (callee.property.name) {
                case "log":
                case "logWarning":
                case "logError":
                    break;
                default:
                    return;
            }
            if (node.arguments.length > 2) context.report({node, messageId: msgKey});
        } };
    }
};
esLintObj.meta.messages[msgKey] = message;
module.exports = esLintObj;
