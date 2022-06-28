"use strict";

module.exports = {
    meta: {
        docs: {
            description: "console.log calls do not clearly imply a logging level",
            category: "better JavaScript coding",
            recommended: true
        },
        fixable: null,  // or "code" or "whitespace"
        schema: [ ],
        messages: {
            NO_CONSOLE_LOG_MSG:
              "Use a specific logging level (debug/info/warn/error) rather than console.log",
        },
    },

    create: context => {  // Called once for the source file
        return { "CallExpression": node => {  // Called for every function call expression
            //console.warn("Executing RULE.create.CallExpression()");
            const callee = node.callee;
            if (callee.type !== "MemberExpression" || callee.property.name !== "log") return;
            if (callee.object.name === "console"
              || (callee.object.object !== undefined && callee.object.object.name === "window"
                && callee.object.property.name === "console"))
                context.report({node, messageId: "NO_CONSOLE_LOG_MSG"});
        } };
    }
};
