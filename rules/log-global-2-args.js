"use strict";

const message =
  "Specify a 2nd parameter, 'source' to identify your source scripting object and function";
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
            if (callee.type !== "MemberExpression" || callee.object.name !== "gs"
              || node.arguments.length > 1) return;
            switch (callee.property.name) {
                case "log":
                case "logWarning":
                case "logError":
                    break;
                default:
                    return;
            }
            context.report({node, messageId});
        }
    }; }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
