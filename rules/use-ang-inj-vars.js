"use strict";

const message = "Use angular injection variables rather than W3C DOM variables";
const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();
const PROHIBITED_SYMBOLS = ["document", "setInterval", "location", "setTimeout", "window"];
const esLintObj = {
    meta: {
        type: "problem",
        docs: {
            description:
            `Use these angular injection variables rather than the corresponding W3C DOM variables:
    $document
    $interval
    $location
    $timeout
    $window`,
            category: "Possible Problems",
        },
        messages: { },
    },

    create: context => {
        return {
            Identifier: (node) => {
                if (!PROHIBITED_SYMBOLS.includes(node.name)) return;
                let k;  // skip if a member like a.b.X instead of X.a.b:
                for (k in node.parent) if (node.parent[k] === node && k === "property") return;
                context.report({node, messageId});
            },
        };
    }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
