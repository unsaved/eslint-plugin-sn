"use strict";

module.exports = {
    meta: {
        docs: {
            description: "Don't hard-code sys_ids",
            category: "better ServiceNow coding",
            recommended: true
        },
        fixable: null,  // or "code" or "whitespace"
        schema: [ ],
        messages: {
            NO_SYSID_MSG: "Use an association to a field value "
              + "meaningful to humans rather than hardcoded sys_id",
        },
    },

    create: context => {  // Called once for the source file
        return { Literal(node) {
            if (/^[\da-f]{32}$/i.test(node.value))
                context.report({node, messageId: "NO_SYSID_MSG"});
        } };
    }
};
