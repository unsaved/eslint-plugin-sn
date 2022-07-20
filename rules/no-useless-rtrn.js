"use strict";

const message =
  "Remove useless assignment to 'rtrn'.  Directly reference the required value: {{directVal}}";
const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();
const esLintObj = {
    meta: {
        type: "suggestion",
        docs: {
            description: "eval assignments are useless, pollute name space, and mislead",
            category: "Possible Problems",
        },
        messages: { },
    },

    create: context => { return {
        Program: node => {
            const exprs = node.body.filter(bmemb => bmemb.type === "ExpressionStatement");
            console.info(exprs.length);
            if (exprs < 1) return;
            const lastExpr = exprs.pop().expression;
            if (lastExpr.type === "AssignmentExpression" && lastExpr.operator === "="
              && lastExpr.left && lastExpr.left.type === "Identifier"
              && lastExpr.left.name === "rtrn" && lastExpr.right)
                context.report({node, messageId,
                  data: { directVal: context.getSourceCode().getText(lastExpr.right)}});
        }
    }; }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
