"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js/, "");
new (require("eslint").RuleTester)().run(baseName, require("../rules/" + baseName), {
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
            errors: [{messageId: "NO_CONSOLE_LOG_MSG"}],
        },
        {
            code: "window.console.log('a msg');",
            errors: [{messageId: "NO_CONSOLE_LOG_MSG"}],
        }
    ]
});
