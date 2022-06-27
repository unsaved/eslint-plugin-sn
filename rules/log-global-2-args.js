"use strict";

module.exports = {
    meta: {
        docs: {
            description: "gs.log* calls should always specify the 'source' parameter",
            category: "better JavaScript coding",
            recommended: true
        },
        fixable: null,  // or "code" or "whitespace"
        schema: [ ],
        messages: {
            LOG_GLOBAL_2_ARGS_MSG: "Specify a 2nd parameter, " +
              "'source' to clearly identify your source scriptingobject and function",
        },
    },

    create: context => {  // Called once for the source file
        return { "CallExpression": node => {  // Called for every function call expression
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
                context.report({node, messageId: "LOG_GLOBAL_2_ARGS_MSG"});
        } };
    }
};
