"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template
new (require("eslint").RuleTester)().run(baseName, require(`../rules/${baseName}`), {
    valid: [
        {
            code: "gs.log('a msg', 'src');",
        },
        {
            code: "gs.logWarning('a msg', 'src');",
        },
        {
            code: "gs.logError('a msg', 'src');",
        }
    ],
    invalid: [
        {
            code: "gs.log('a msg');",
            errors: [{messageId}],
        },
        {
            code: "gs.logWarning('a msg');",
            errors: [{messageId}],
        },
        {
            code: "gs.logError('a msg');",
            errors: [{messageId}],
        }
    ]
});
