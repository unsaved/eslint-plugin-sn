"use strict";

const message =
 "Use GlideAggregate instead of GlideRecord for counting unless you will iterate over the instance";
const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();

let grVars;
const countPoints = [], nexters = [];
const checkInstantiator = (astId, newExpr) => {
    if (astId.type === "Identifier"
      && newExpr.callee !== undefined && newExpr.callee.type === "Identifier"
      && newExpr.callee.name === "GlideRecord") grVars.push(astId.name);
};

const esLintObj = {
    meta: {
        type: "problem",
        docs: {
            description:  // eslint-disable-next-line max-len
              `Use GlideAggregate instead of GlideRecord for counting unless you will use theGlideRecord instance to iterate over the records.`,
            category: "Suggestions",
        },
        messages: { },
    },

    create: context => {
        grVars = ["current", "previous"];
        countPoints.length = 0; nexters.length = 0;
        return {
            CallExpression: (node) => {
                if (!node.callee || !node.callee.object || !node.callee.property
                  || !grVars.includes(node.callee.object.name)
                  || !["getRowCount", "next", "_next"].includes(node.callee.property.name)) return;
                if (node.callee.property.name === "getRowCount")
                    countPoints.push({name: node.callee.object.name, node});
                else
                    nexters.push(node.callee.object.name);
            },
            VariableDeclarator: node => {
                if (node.id && node.init && node.init.type === "NewExpression")
                    checkInstantiator(node.id, node.init);
            }, AssignmentExpression: node => {
                if (node.left && node.right && node.right.type === "NewExpression")
                    checkInstantiator(node.left, node.right);
            },
            onCodePathEnd: (_dummy, node) => {
                console.warn("nexters and countPoints lengths", nexters.length, countPoints.length);
                if (node.type !== "Program" || countPoints.length < 1) return;
                //console.warn("nexters and countPoints", nexters, countPoints.map(cp=>cp.name));
                // eslint-disable-next-line array-callback-return
                countPoints.filter(cp => !nexters.includes(cp.name)).forEach(cp =>
                    context.report({node: cp.node, messageId})
                );
            }
        };
    }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
