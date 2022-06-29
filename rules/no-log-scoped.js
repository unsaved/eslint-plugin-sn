"use strict";

module.exports = {
    meta: {
        docs: {
            description: "Only ServiceNow server scoped scripts may use gs.debug/warn/info/error",
            category: "API violaton",
            recommended: true
        },
        fixable: null,  // or "code" or "whitespace"
        schema: [ ],
        messages: {
            NO_LOG_SCOPED_MSG: "In a global script use gs.log* to " +
              "log rather than gs.debug/info/warn/error"
        },
    },

    create: context => {  // Called once for the source file
        return { "CallExpression": node => {  // Called for every function call expression
            //console.warn("Executing RULE.create.CallExpression()");
            const callee = node.callee;
            if (callee.type === "MemberExpression" && callee.object.name === "gs"
              && /^(debug|info|warn|error)?$/.test(callee.property.name))
                context.report({node, messageId: "NO_LOG_SCOPED_MSG"});
        } };
    }
};
