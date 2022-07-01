"use strict";

module.exports = {
    meta: {
        docs: {
            description: "Only ServiceNow server global scripts may use gs.log* or gs.print",
            category: "API violaton",
            recommended: true
        },
        fixable: null,  // or "code" or "whitespace"
        schema: [ ],
        messages: {
            NO_LOG_GLOBAL_MSG: "In a scoped script use gs.debug/info/warn/error to " +
              "log rather than gs.log* or gs.print"
        },
    },

    create: context => {  // Called once for the source file
        return { CallExpression: node => {  // Called for every function call expression
            //console.warn("Executing RULE.create.CallExpression()");
            const callee = node.callee;
            if (callee.type === "MemberExpression" && callee.object.name === "gs"
              && (/^log(Warning|Error)?$/.test(callee.property.name)
                || callee.property.name === "print"))
                context.report({node, messageId: "NO_LOG_GLOBAL_MSG"});
        } };
    }
};
