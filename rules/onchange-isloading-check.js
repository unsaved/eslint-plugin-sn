"use strict";

const strip = require("strip-comments");

const message = "On-change client scripts should check isLoading and abort";
const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();
const esLintObj = {
    meta: {
        type: "problem",
        docs: {
            description: "On-change client scripts should check isLoading and abort",
            category: "Possible Problems",
        },
        messages: { },
    },

    create: context => {
        return {
            BlockStatement: (node) => {
                if (!node.parent || node.parent.type !== "FunctionDeclaration"
                  || !node.parent.parent || node.parent.parent.type !== "Program"
                  || !node.parent.id || !node.parent.id.name || node.parent.id.name !== "onChange")
                    return;
                const fn = node.parent;
                if (!fn.params) throw new Error("No params for onChange function");
                //console.warn(fn.params.length + " params");
                if (fn.params.length < 4 || !fn.params[3] || fn.params[3].name !== "isLoading") {
                    context.report({node: fn, messageId});
                    return;
                }
                if (!fn.body || fn.body.type !== "BlockStatement" || !fn.body.body
                  || !Array.isArray(fn.body.body) ||
                  fn.body.body.filter(st => st.type === "IfStatement").every(st =>
                    // Crazy complicated to check for all possible variants of checking
                    // isLoading, so we just look for occurrence of string "isLoading" in here:
                    //console.warn("(" + strip(context.getSourceCode().getText(st)) + ")");
                    !/\bisLoading\b/.test(strip(context.getSourceCode().getText(st)))
                  )) context.report({node, messageId});
            },
        };
    }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
