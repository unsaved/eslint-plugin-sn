"use strict";

const message = "Scoped logging statements require one string param " +
  "and can only take additional params if the first contains {INT} placeholders";
const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();
const esLintObj = {
    meta: {
        type: "problem",
        docs: {
            description: "gs.debug/info/warn/err* calls require first "
              + "string param and it must contain placeholders if additional params follow",
            category: "Possible Problems",
        },
        messages: { },
    },

    create: context => { return {
        CallExpression: node => {
            const callee = node.callee;
            if (callee.type !== "MemberExpression" || callee.object.name !== "gs"
              || node.arguments.length === 1) return;
            switch (callee.property.name) {
                case "debug":
                case "info":
                case "warn":
                case "error":
                    break;
                default:
                    return;
            }
            if (node.arguments.length < 1) {
                context.report({node, messageId});
                return;
            }
            // Could dynamically contain {INT} placeholders:
            if (node.arguments[0].type === "Literal"
              && !/[{]\d+[}]/.test(node.arguments[0].value)) context.report({node, messageId});
        }
    }; }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
