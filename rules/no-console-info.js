"use strict";

const message = "Use a specific logging level (debug/info/warn/error) rather than console.log";
const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();
const esLintObj = {
    meta: {
        type: "suggestion",
        docs: {
            description: "console.log calls do not clearly imply a logging level",
            category: "Possible Problems",
        },
        messages: { },
    },

    create: context => { return {
        CallExpression: node => {
            const callee = node.callee;
            if (callee.type !== "MemberExpression" || callee.property.name !== "log") return;
            if (callee.object.name === "console"
              || callee.object.object !== undefined && callee.object.object.name === "window"
                && callee.object.property.name === "console")
                context.report({node, messageId});
        }
    }; }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
