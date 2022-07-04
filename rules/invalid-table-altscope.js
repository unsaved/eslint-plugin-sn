"use strict";

const message =
  "Invalid table/scope combo";
// eslint-disable-next-line prefer-template
const msgKey = (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();
let beenCalled = false;
const esLintObj = {
    meta: {
        type: "problem",
        docs: {
            description: "This is to always fail for invalid table/altscope combinations",
            category: "Fatal",
        },
        schema: [ ],
        messages: { },
    },

    create: context => {  // Called once for the source file
        return { onCodePathStart: (codePath, node) => {
            if (beenCalled) return;
            beenCalled = true;
            context.report({node, messageId: msgKey});
        } };
    },
};
esLintObj.meta.messages[msgKey] = message;
module.exports = esLintObj;
