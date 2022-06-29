"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js/, "");
new (require("eslint").RuleTester)().run(baseName, require("../rules/" + baseName), {
    invalid: [
        {
            code: "gs.debug('a msg');",
            errors: [{messageId: "NO_LOG_SCOPED_MSG"}],
        },
        {
            code: "gs.info('a msg');",
            errors: [{messageId: "NO_LOG_SCOPED_MSG"}],
        },
        {
            code: "gs.warn('a msg');",
            errors: [{messageId: "NO_LOG_SCOPED_MSG"}],
        },
        {
            code: "gs.error('a msg');",
            errors: [{messageId: "NO_LOG_SCOPED_MSG"}],
        },
    ],
    valid: [
        {
            code: "gs.log('a msg', 'src');",
        },
        {
            code: "gs.logWarning('a msg', 'src');",
        },
        {
            code: "gs.logError('a msg', 'src');",
        },
        {
            code: "gs.print('a msg');",
        },
    ]
});
