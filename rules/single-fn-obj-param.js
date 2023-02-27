"use strict";

/**
 * Require that script contain at the top level only a single obj-parameter function
 */

const message =  // eslint-disable-next-line max-len
  `Scriptlet contains at top level {{fnCount}} single obj-parameter functions + {{otherCount}} other expressions.
{{table}} scripts require 1 + 0.
Function def should not have a terminating ; (this will count as a spurious extra expression).`;
const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();

const esLintObj = {
    meta: {
        type: "problem",
        docs: {
            description:
              "ServiceNow NE client scriptlets require a single obj-param function at top level",
            category: "Possible Problems",
        },
        schema: [{
            type: "object",
            properties: {
                table: { type: "string", },
            },
            additionalProperties: false
        }],
        messages: { },
    },

    create: context => {
        let fnCount = 0;
        return {
            FunctionDeclaration: node => {
                if (node.parent.type !== "Program") return;
                if (node.params.length === 1 && node.params[0].type === "ObjectPattern") fnCount++;
            },
            FunctionExpression: node => {
                if (node.parent.type !== "ExpressionStatement") return;
                if (node.parent.parent.type !== "Program") return;
                if (node.params.length === 1 && node.params[0].type === "ObjectPattern") fnCount++;
            },
            ArrowFunctionExpression: node => {
                if (node.parent.type !== "ExpressionStatement") return;
                if (node.parent.parent.type !== "Program") return;
                if (node.params.length === 1 && node.params[0].type === "ObjectPattern") fnCount++;
            },
            onCodePathEnd: (codePath, node) => {
                if (node.type !== "Program") return;
                let otherCount = node.body.length - fnCount;
                if (fnCount === 1 && context.getSourceCode().getLastToken(node).value === ";")
                    otherCount++;
                if (fnCount !== 1 || otherCount !== 0)
                    context.report({node, messageId, data: {
                        fnCount,
                        otherCount,
                        table: context.options[0].table,
                    } });
                //else console.info(`${fnCount} + ${otherCount}`);
            }
        };
    }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
