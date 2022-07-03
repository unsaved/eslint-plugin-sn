"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const msgKey = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template
new (require("eslint").RuleTester)().run(baseName, require(`../rules/${baseName}`), {
    valid: [
        {
            code: "gs.debug('a msg');",
        },
        {
            code: "gs.info('a msg');",
        },
        {
            code: "gs.warn('a msg');",
        },
        {
            code: "gs.error('a msg');",
        },
    ],
    invalid: [
        {
            code: "gs.print('a msg');",
            errors: [{messageId: msgKey}],
        },
        {
            code: "gs.log('a msg', 'src');",
            errors: [{messageId: msgKey}],
        },
        {
            code: "gs.logWarning('a msg', 'src');",
            errors: [{messageId: msgKey}],
        },
        {
            code: "gs.logError('a msg', 'src');",
            errors: [{messageId: msgKey}],
        }
    ]
});
