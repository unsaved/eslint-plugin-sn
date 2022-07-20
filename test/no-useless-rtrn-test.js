"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template

new (require("eslint").RuleTester)().run(baseName, require(`../rules/${baseName}`), {
    valid: [
        "console.info('a msg');",
        "",
        'console.info("a msg");\nconsole.info("a msg");\nother={alpha:1,beta:"two"};',
    ],
    invalid: [
        {
            code: 'console.info("a msg");\nconsole.info("a msg");\nrtrn={alpha:1,beta:"two"};',
            errors: [{messageId}],
        },
    ]
});
