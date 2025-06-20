"use strict";

const message =
  "console.log/info/warn/error are intended for scoped contexts.  Use gs.log* or gs.print.";
const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();
const esLintObj = {
    meta: {
        type: "problem",
        docs: {
            description:
              "Only ServiceNow server scoped scripts should use console.log/debug/warn/info/error",
            category: "Possible Problems",
        },
        messages: { },
    },

    create: context => { return {
        CallExpression: node => {
            const callee = node.callee;
            if (callee.type === "MemberExpression" && callee.object.name === "console"
              && /^(log|debug|info|warn|error)?$/.test(callee.property.name))
                context.report({node, messageId});
        }
    }; }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
