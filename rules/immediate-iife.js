"use strict";

/**
 * It may be possible to define a function in an Script Include (server or mid), invoke it,
 * then make it available to callers by include mechanism.
 * Very unlikely to happen in a realistic situation.
 */

const message = `Non-immediate IIFE '{{name}}'.  To not pollute namespace, code like:
  (function(x,y){...}).(a,b);";   OR if platform honors fn names: function x(x,y) {...}).(a,b);`;
const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();

let varMap;  // Map from candidate variables to that variable's scope

const checkBody= (body, context) => {
    body.some((n, i) => {
        if (i === 0) return false;
        if (n.type !== "ExpressionStatement" || body[i-1].type !== "VariableDeclaration")
            return false;
        const es = n;
        // LAST VariableDeclarator:
        const vdDeclarations = body[i-1].declarations;
        const lastVD = vdDeclarations[vdDeclarations.length-1];
        if (lastVD.id.type !== "Identifier") return false;
        const exprCaller = es.expression.callee;
        if (exprCaller === undefined) return false;
        if (exprCaller.name === lastVD.id.name) {
            varMap[exprCaller.name] = {scope: context.getScope()};
            return true;
        }
        return false;
    });
};

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
        varMap = {};
        return {
            BlockStatement: node => {
                checkBody(node.body, context);
            }, onCodePathEnd: (codePath, node) => {
                if (node.type !== "Program") return;
                checkBody(node.body, context);
                Object.keys(varMap).forEach(me => {
                    const entry = varMap[me];
                    const astVar = entry.scope.variables.find(en=>en.name===me);
                    //console.debug(astVar.defs.length);
                    const loc = astVar.defs[0].node.loc;
                    context.report({messageId, loc, data: {name: me}});
                });
            },
        };
    }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
