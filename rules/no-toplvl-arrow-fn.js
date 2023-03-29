"use strict";

const message = "This type of ServiceNow script doesn't allow arrow function at top level";
const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();
const esLintObj = {
    meta: {
        type: "problem",
        docs: {
            description:
       "Some types of ServiceNow scripts don't allow arrow functions even though the ES level does",
            category: "Possible Problems",
        },
        messages: { },
    },

    create: context => {
        return {
            ArrowFunctionExpression: (node) => {
                if (node.parent.parent.parent === null) context.report({node, messageId});
            },
        };
    }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
