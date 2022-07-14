"use strict";

/**
 * This rule ALWAYS fails when it is executed
 */
const OOTB_ALTS = [
    "global",
    "scoped",
    "iso",
    "noniso",
    "iso_globalaction",
    "noniso_globalaction",
    "iso_scopedaction",
    "noniso_scopedaction"
].sort();
const OOTB_TABLES = [
    "catalog_script_client",
    "ecc_agent_script",
    "ecc_agent_script_include",
    "expert_script_client",
    "sa_pattern_prepost_script",
    "sc_cat_item_producer",
    "sysauto_script",
    "sysevent_script_action",
    "sys_processor",
    "sys_script",
    "sys_script_client",
    "sys_script_email",
    "sys_script_fix",
    "sys_script_include",
    "sys_security_acl",
    "sys_transform_entry",
    "sys_transform_map",
    "sys_transform_script",
    "sys_web_service",
    "sys_ws_operation",
    "sys_ui_action",
    "sys_ui_policy.script_true",
    "sys_ui_policy.script_false",
    "sys_ui_script",
].sort();
const message = `Invalid table/scopealt combo '{{table}}/{{scopealt}}'.
Table alternatives are: {{allTables}}
Scopealt alternatives are none/unset and: {{allAlts}}`;
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
        const allAlts = OOTB_ALTS.slice();
        const allTables = OOTB_TABLES.slice();
        if (context.settings && context.settings.customTables)
            Array.prototype.push.apply(allTables, context.settings.customTables);
        if (context.settings && context.settings.customAlts)
            Array.prototype.push.apply(allAlts, context.settings.customAlts);
        return {
            onCodePathStart: (codePath, node) => {
                if (node.type !== "Program") return;
                let t, a;
                if (context.settings && context.settings.testTable) {
                    t = context.settings.testTable;
                    if (context.settings.testAltScope) a = context.settings.testAltScope;
                } else {
                    // Imperfect way to distinguish if alt directory or no alt directory.
                    // We check if that token in that position is a known altscope.
                    // If we miss it, no major issue since this is only for error reporting.
                    const ex =
                      /([^\\/]+)[\\/]([^\\/]+)[\\/][^\\/]+[.]js/.exec(context.getFilename());
                    if (!ex)
                        throw new Error(`Malformatted ESLint filename: ${context.getFilename()}`);
                    if (allAlts.includes(ex[2])) {
                        t = ex[1]; a = ex[2];
                    } else {
                        t = ex[2]; a = '<NONE>';
                    }
                }
                context.report({node, messageId, data: {
                    table: t,
                    scopealt: a,
                    allTables,
                    allAlts,
                }});
            }
        };
    }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
