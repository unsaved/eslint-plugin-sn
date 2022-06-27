"use strict";

let beenCalled = false;
module.exports = {
    meta: {
        docs: {
            description: "This is to always fail for invalid table/altscope combinations",
            category: "@admc.com/sn system",
            recommended: true
        },
        fixable: null,  // or "code" or "whitespace"
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
