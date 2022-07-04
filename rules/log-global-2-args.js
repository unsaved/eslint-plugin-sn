"use strict";

const message =
  "Specify a 2nd parameter, 'source' to clearly identify your source scripting object and function";
// eslint-disable-next-line prefer-template
const msgKey = (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();
const esLintObj = {
    meta: {
        type: "problem",
        docs: {
            description: "gs.log* calls should always specify the 'source' parameter",
            category: "Possible Problems",
        },
        schema: [ ],
        messages: { },
    },

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
            if (node.arguments.length < 2)
                context.report({node, messageId: msgKey});
        } };
    }
};
esLintObj.meta.messages[msgKey] = message;
module.exports = esLintObj;
