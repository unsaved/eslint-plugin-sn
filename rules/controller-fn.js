"use strict";

/**
 * Crazy, arbitrary requirements by ServiceNow
 */
const message = "See rule docs for ServiceNow and MCE's crazy requiements for controller def";
const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();

const esLintObj = {
    meta: {
        type: "problem",
        docs: {
            description:
              `sp_widget.client_script to satisy MCE editor and execution requirements must
start with precisely
    function(
OR
    function x(
OR
    api.controller = function(
The first two forms (traditional) of definition must end with } (and no ;).
Either can be followed by other statement(s) or comments, but for practical
reasons SNLint doesn't support this.
{{table}} scripts require 1 + 0.
This check depends on snLint which transfers incomplete JavaScript scripts of
the first two forms into valid assignment scripts of the last form above.
The ES Lint rule itself therefore tests only for the last form.`,
            category: "Possible Problems",
        },
        messages: { },
    },

    create: context => {
        return {
            onCodePathEnd: (_dummy, node) => {
                if (node.type === "Program"
                  && !/^api.controller ?= ?function {0,2}\(/.test(context.getSourceCode().text))
                    context.report({node, messageId});
            }
        };
    }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
