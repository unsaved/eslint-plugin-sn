"use strict";

const message =
  "In a scoped script use gs.debug/info/warn/error to log rather than gs.log* or gs.print";
const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();
const esLintObj = {
    meta: {
        type: "problem",
        docs: {
            description: "Only ServiceNow server global scripts may use gs.log* or gs.print",
            category: "Possible Problems",
        },
        messages: { },
    },

    create: context => {  // Called once for the source file
        return { CallExpression: node => {  // Called for every function call expression
            //console.warn("Executing RULE.create.CallExpression()");
            const callee = node.callee;
            if (callee.type === "MemberExpression" && callee.object.name === "gs"
              && (/^log(Warning|Error)?$/.test(callee.property.name)
                || callee.property.name === "print"))
                context.report({node, messageId});
        } };
    }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
