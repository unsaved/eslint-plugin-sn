"use strict";

const message = "Don't call current.update in BR scriptlets";
const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();
const esLintObj = {
    meta: {
        type: "problem",
        docs: {
            description:
              'There is "almost never" a good reason to call current.update in a BR scriptlet',
            category: "Possible Problems",
        },
        messages: { },
    },

    create: context => {
        return {
            CallExpression: (node) => {
                if (node.callee && node.callee.object && node.callee.property
                  && node.callee.object.type === "Identifier"
                  && node.callee.property.type === "Identifier"
                  && node.callee.object.name === "current"
                  && node.callee.property.name === "update")
                    context.report({node, messageId});
            },
        };
    }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
