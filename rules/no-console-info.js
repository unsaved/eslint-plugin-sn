"use strict";

const message =
  "Use a specific logging level (debug/info/warn/error) rather than console.log";
// eslint-disable-next-line prefer-template
const msgKey = (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();
const esLintObj = {
    meta: {
        type: "suggestion",
        docs: {
            description: "console.log calls do not clearly imply a logging level",
            category: "Possible Problems",
            recommended: true
        },
        schema: [ ],
        messages: { },
    },

    create: context => {  // Called once for the source file
        return { CallExpression: node => {  // Called for every function call expression
            //console.warn("Executing RULE.create.CallExpression()");
            const callee = node.callee;
            if (callee.type !== "MemberExpression" || callee.property.name !== "log") return;
            if (callee.object.name === "console"
              || callee.object.object !== undefined && callee.object.object.name === "window"
                && callee.object.property.name === "console")
                context.report({node, messageId: msgKey});
        } };
    }
};
esLintObj.meta.messages[msgKey] = message;
module.exports = esLintObj;
