"use strict";

/**
 * This rule ALWAYS fails when it is executed
 */
const ALTSCOPES = ["global", "scoped", "iso", "noniso",
  "iso_globalaction", "noniso_globalaction", "iso_scopedaction", "noniso_scopedaction"];
const message =
`Invalid table/scopealt combo '{{table}}/{{scopealt}}'.  Scopealt possibilities: ${ALTSCOPES}`;
const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();
const esLintObj = {
    meta: {
        type: "problem",
        docs: {
            description: "This is to always fail for invalid table/altscope combinations",
            category: "Fatal",
        },
        messages: { },
    },

    create: context => {
        return {
            onCodePathStart: (codePath, node) => {
                if (node.type !== "Program") return;
                const ex = /([^/]+)[/]([^/]+)[/][^/]+[.]js/.exec(context.getFilename());
                if (!ex) throw new Error(`Malformatted ESLint filename: ${context.getFilename()}`);
                let t, a;
                if (ALTSCOPES.includes(ex[2])) {
                    t = ex[1]; a = ex[2];
                } else {
                    t = ex[2]; a = '<NONE>';
                }
                context.report({node, messageId, data: {
                    table: t,
                    scopealt: a
                }});
            }
        };
    }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
