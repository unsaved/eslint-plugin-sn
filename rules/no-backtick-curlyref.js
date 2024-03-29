"use strict";

/* eslint-disable no-template-curly-in-string */

/**
 * In sys_ui_scripts and all sp_widget scripts, the platform will substitute ${...} refs occurring
 * anywhere with the sys_ui_message table.
 * Therefore to avoid conflict with ES12 backtick ${...} templating, don't allow the ES12 backtick
 * substitutions.
 */
const message = "ES12 backtick ${...} templating will not work with this script type";
const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();
const esLintObj = {
    meta: {
        type: "problem",
        docs: {
            description:  // eslint-disable-next-line
              "Due to ServiceNow sys_ui_message substitution, ES12 backtick templating won't work with several SN script types",
            category: "Possible Problems",
        },
        messages: { },
    },

    create: context => { return {
        TemplateLiteral: node => {
            //console.warn("TemplateLiberal exprs", node.expressions.length);
            if (node.expressions.length > 0) context.report({node, messageId});
        },
    }; }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
