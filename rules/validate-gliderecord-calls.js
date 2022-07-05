"use strict";

const message =
  "Check return values of GlideRecord insert, update, get, next, deleteRecord calls.  "
  + "This can detect many common runtime problems.";
const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();

const GR_CHECK_FNS = ["insert", "update", "get", "deleteRecord", "next", "_next"];
const grVars = [];
const checkInstantiator = (astId, newExpr) => {
    /*console.debug("Called cI adding: " +
      (astId.type === "Identifier"
      && newExpr.callee !== undefined && newExpr.callee.type === "Identifier"
      && newExpr.callee.name === "GlideRecord" ? astId.name : "<nul>")); */
    if (astId.type === "Identifier"
      && newExpr.callee !== undefined && newExpr.callee.type === "Identifier"
      && newExpr.callee.name === "GlideRecord") grVars.push(astId.name);
};

const esLintObj = {
    meta: {
        type: "problem",
        docs: {
            description:
              "Require checking GlideRecord insert, update, get, next, deleteRecord return values.",
            category: "Possible Problems",
        },
        /*
        schema: [{
            type: "object",
            properties: {
                grFactoryFunctions: {
                    type: "array",
                    items: {
                        type: "string"
                    },
                    uniqueItems: true
                },
            },
            additionalProperties: false
        }],
        */
        messages: { },
    },

    create: context => { return {
        CallExpression: (node) => {
            /*console.info("CE: " + ((node.callee && node.callee.object
              && node.callee.property && grVars.includes(node.callee.object.name))
              ? node.callee.property.name : "<nil>"));*/
            if (!node.callee || !node.callee.object || !node.callee.property
              || !grVars.includes(node.callee.object.name)
              || !GR_CHECK_FNS.includes(node.callee.property.name)) return;
            // Good if CallExpression parent is IfStatement or SwitchStatement
            if (node.parent.type !== "ExpressionStatement") return;
            switch (node.parent.parent.type) {
                case "Program":
                case "BlockStatement":
                    context.report({node, messageId});
                    break;
                // purposefully no default
            }
        },
        VariableDeclarator: node => {
            if (node.id && node.init && node.init.type === "NewExpression")
                checkInstantiator(node.id, node.init);
        }, AssignmentExpression: node => {
            if (node.left && node.right && node.right.type === "NewExpression")
                checkInstantiator(node.left, node.right);
        }
    }; }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
