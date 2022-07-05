"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template
new (require("eslint").RuleTester)().run(baseName, require(`../rules/${baseName}`), {
    valid: [
        "console.info('a msg');",
        "window.console.info('a msg');",
    ],
    invalid: [
        {
            code: "console.log('a msg');",
            errors: [{messageId}],
        },
        {
            code: "window.console.log('a msg');",
            errors: [{messageId}],
        }
    ]
});
