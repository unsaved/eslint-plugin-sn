"use strict";

/**
 * It may be possible to define a function in an Script Include (server or mid), invoke it,
 * then make it available to callers by include mechanism.
 * Very unlikely to happen in a realistic situation.
 *
 * I think this suffers from not handling same var/fn name at different scope levels.
 */

const message = "Non-immediate IIFE '{{name}}'.  code like: (function(x,y){...}).(a,b);";
const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();

const esLintObj = {
    meta: {
        type: "problem",
        docs: {
            description:
    "This looks for a function definition followed immediately at same level with an invocation.\n"
              + "This indicates of an attempt at IIFE but the function is persisted to the scope.",
            category: "Possible Problems",
        },
        messages: { },
    },

    create: context => {
        return {
            CallExpression: node => {
                if (!node.callee || node.callee.type !== "Identifier") return;
                const esAst = node.parent;
                if (esAst.type !== "ExpressionStatement") return;
                if (!node.parent.parent.body) return;
                if (!Array.isArray(node.parent.parent.body)) return;
                const prevBodIndex =
                  node.parent.parent.body.findIndex(bodElAst => bodElAst === esAst) - 1;
                if (prevBodIndex < 0) return;
                const prevAst = node.parent.parent.body[prevBodIndex];
                switch (prevAst.type) {
                    case "FunctionDeclaration":
                        if (prevAst.id.name === node.callee.name)
                            context.report({node, messageId, data: { name: node.callee.name }});
                        break;
                    case "VariableDeclaration":
                        if (prevAst.declarations && prevAst.declarations.length === 1
                          && prevAst.declarations[0].id
                          && prevAst.declarations[0].id.name === node.callee.name)
                            context.report({node, messageId, data: { name: node.callee.name }});
                        break;
                    // purposefully no default
                }
            },
        };
    }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
