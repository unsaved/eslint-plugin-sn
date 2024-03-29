"use strict";

const tableMessage = `Invalid table '{{table}}'.
Table alternatives are: {{allTables}}`;
// eslint-disable-next-line max-len
const altMessage = `Invalid table/scopealt combo '{{table}}/{{alt}}.  Available alts for table {{table}} are {{alts}}`;
/* eslint-disable prefer-template */
const tableMessageId =
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase() + "_table";
const altMessageId =
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase() + "_alt";
/* eslint-enable prefer-template */
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
        const allTables = context.settings.customTables ?
            { ...context.settings.ootbTables, ...context.settings.customTables } :
            context.settings.ootbTables;
        return {
            onCodePathStart: (_dummy, node) => {
                if (node.type !== "Program") return;
                let t, a = null;
                if (context.settings && context.settings.testTable) {
                    t = context.settings.testTable;
                    if (context.settings.testAltScope) a = context.settings.testAltScope;
                } else {
                    // Imperfect way to distinguish if alt directory or no alt directory.
                    // We check if that token in table position is a supported table that has
                    // alts defined.
                    const ex =
                      /([^\\/]+)[\\/]([^\\/]+)[\\/][^\\/]+[.]js/.exec(context.getFilename());
                    if (!ex)
                        throw new Error(`Malformatted ESLint filename: ${context.getFilename()}`);
                    if (Array.isArray(allTables[ex[1]])) {
                        t = ex[1]; a = ex[2];
                    } else {
                        t = ex[2];
                    }
                }
                if (t in allTables) {
                    if (allTables[t] === null && a !== null
                      || Array.isArray(allTables[t]) && !allTables[t].includes(a))
                        context.report({node, messageId: altMessageId, data: {
                            table: t,
                            alt: a,
                            alts: allTables[t],
                        }});
                } else {
                    context.report({node, messageId: tableMessageId, data: {
                        table: t,
                        allTables: Object.keys(allTables),
                    }});
                }
            }
        };
    }
};
esLintObj.meta.messages[tableMessageId] = tableMessage;
esLintObj.meta.messages[altMessageId] = altMessage;
module.exports = esLintObj;
