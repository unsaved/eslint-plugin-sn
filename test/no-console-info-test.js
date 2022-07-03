"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const msgKey = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template
new (require("eslint").RuleTester)().run(baseName, require(`../rules/${baseName}`), {
    valid: [
        {
            code: "console.info('a msg');",
        },
        {
            code: "window.console.info('a msg');",
        }
    ],
    invalid: [
        {
            code: "console.log('a msg');",
            errors: [{messageId: msgKey}],
        },
        {
            code: "window.console.log('a msg');",
            errors: [{messageId: msgKey}],
        }
    ]
});
