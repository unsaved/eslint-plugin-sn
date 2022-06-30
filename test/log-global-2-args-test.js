"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js/, "");
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
            errors: [{messageId: "LOG_GLOBAL_2_ARGS_MSG"}],
        },
        {
            code: "gs.logWarning('a msg');",
            errors: [{messageId: "LOG_GLOBAL_2_ARGS_MSG"}],
        },
        {
            code: "gs.logError('a msg');",
            errors: [{messageId: "LOG_GLOBAL_2_ARGS_MSG"}],
        }
    ]
});
