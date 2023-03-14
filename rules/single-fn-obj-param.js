"use strict";

/**
 * Require that script contain at the top level only a single obj-parameter function
 */

const message =  // eslint-disable-next-line max-len
  `Scriptlet contains at top level {{fnCount}} functions + {{otherCount}} other expressions.
{{table}} scripts require 1 + 0.
Function def should not have a terminating ; (this will count as a spurious extra expression).
Some of the script types don't support more than one param for the functin.`;
const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();

const esLintObj = {
    meta: {
        type: "problem",
        docs: {
            description:
              "ServiceNow NE scriptlets require a single function at top level (+ some <= 1 param)",
            category: "Possible Problems",
        },
        schema: [{
            type: "object",
            properties: {
                table: { type: "string", },
                allowAdditionalParams: { type: "boolean" },
            },
            additionalProperties: false
        }],
        messages: { },
    },

    create: context => {
        let fnCount = 0;
        const multiParams = !!context.options[0].allowAdditionalParams;
        let overParams = false;
        return {
            FunctionDeclaration: node => {
                if (node.parent.type !== "Program") return;
                if (node.params.length < 2 || multiParams) { fnCount++; return; }
                overParams = true;
            },
            FunctionExpression: node => {
                if (node.parent.type !== "ExpressionStatement") return;
                if (node.parent.parent.type !== "Program") return;
                if (node.params.length < 2 || multiParams) { fnCount++; return; }
                overParams = true;
            },
            ArrowFunctionExpression: node => {
                if (node.parent.type !== "ExpressionStatement") return;
                if (node.parent.parent.type !== "Program") return;
                if (node.params.length < 2 || multiParams) { fnCount++; return; }
                overParams = true;
            },
            onCodePathEnd: (codePath, node) => {
                if (node.type !== "Program") return;
                let otherCount = node.body.length - fnCount;
                if (fnCount === 1 && context.getSourceCode().getLastToken(node).value === ";")
                    otherCount++;
                if (fnCount !== 1 || otherCount !== 0 || overParams)
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
