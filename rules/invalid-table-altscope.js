"use strict";

let beenCalled = false;
module.exports = {
    meta: {
        type: "problem",
        docs: {
            description: "This is to always fail for invalid table/altscope combinations",
            category: "Fatal",
            recommended: true
        },
        schema: [ ],
        messages: { INVALID_TABLE_ALTSCOPE_MSG: "Invalid table/scope combo" },
    },

    create: context => {  // Called once for the source file
        return { onCodePathStart: (codePath, node) => {
            if (beenCalled) return;
            beenCalled = true;
            context.report({node, messageId: "INVALID_TABLE_ALTSCOPE_MSG"});
        } };
    },
};
