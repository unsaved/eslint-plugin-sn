"use strict";

const message =
  "Specify a 2nd parameter, 'source' to clearly identify your source scripting object and function";
const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();
const esLintObj = {
    meta: {
        type: "problem",
        docs: {
            description: "gs.log* calls should always specify the 'source' parameter",
            category: "Possible Problems",
        },
        messages: { },
    },

    create: context => { return {
        CallExpression: node => {
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
                context.report({node, messageId});
        }
    }; }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
