"use strict";

const message = "log rather than gs.debug/info/warn/error";
// eslint-disable-next-line prefer-template
const msgKey = (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();
const esLintObj = {
    meta: {
        type: "problem",
        docs: {
            description: "Only ServiceNow server scoped scripts may use gs.debug/warn/info/error",
            category: "Possible Problems",
        },
        schema: [ ],
        messages: { },
    },

    create: context => {  // Called once for the source file
        return { CallExpression: node => {  // Called for every function call expression
            //console.warn("Executing RULE.create.CallExpression()");
            const callee = node.callee;
            if (callee.type === "MemberExpression" && callee.object.name === "gs"
              && /^(debug|info|warn|error)?$/.test(callee.property.name))
                context.report({node, messageId: msgKey});
        } };
    }
};
esLintObj.meta.messages[msgKey] = message;
module.exports = esLintObj;
