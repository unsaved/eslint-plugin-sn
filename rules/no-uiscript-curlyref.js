"use strict";

/* eslint-disable no-template-curly-in-string */

/**
 * N.b. ServiceNow will clobber ${...} refs regardless whether inside of backticks, so that's what
 * we check for.
 * I only know that this doesn't work for non-global UI scripts loaded by *.jsdbx.
 * If testing shows that it also fails in global UI scripts and when loaded by jelly form formatter
 * and mobile/portal g_ui_scripts cals, then set rule level to error.
 * Until this is known, probably safer to leave at warn level.
 *
 * WARNING:  2024-01-10:  This rule being deprecated and replaced by new rule no-backtick-curlref,
 *                        due to now understanding the root cause of the problem, and having
 *                        tested the behavior thoroughly.
*/

const message =
  "ServiceNow UI Scripts, at least when loaded as *.jsdbx file clobber ${...} references";
const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();
const esLintObj = {
    meta: {
        type: "problem",
        docs: {
            description:
              "Flag ${...} usage in UI Scripts since not supported (in most or all cases)",
            category: "Possible Problems",
        },
        messages: { },
    },

    create: _dummy => { return { }; }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
