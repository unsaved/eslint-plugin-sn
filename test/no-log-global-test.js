"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js/, "");
new (require("eslint").RuleTester)().run(baseName, require("../rules/" + baseName), {
    valid: [
        {
            code: "gs.info('a msg');",
        },
        {
            code: "gs.warn('a msg');",
        }
    ],
    invalid: [
        {
            code: "gs.log('a msg');",
            errors: [{messageId: "NO_LOG_GLOBAL_MSG"}],
        },
        {
            code: "gs.logWarning('a msg');",
            errors: [{messageId: "NO_LOG_GLOBAL_MSG"}],
        },
        {
            code: "gs.logError('a msg');",
            errors: [{messageId: "NO_LOG_GLOBAL_MSG"}],
        }
    ]
});
