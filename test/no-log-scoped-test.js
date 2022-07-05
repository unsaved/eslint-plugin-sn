"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template
new (require("eslint").RuleTester)().run(baseName, require(`../rules/${baseName}`), {
    invalid: [
        {
            code: "gs.debug('a msg');",
            errors: [{messageId}],
        },
        {
            code: "gs.info('a msg');",
            errors: [{messageId}],
        },
        {
            code: "gs.warn('a msg');",
            errors: [{messageId}],
        },
        {
            code: "gs.error('a msg');",
            errors: [{messageId}],
        },
    ],
    valid: [
        "gs.log('a msg', 'src');",
        "gs.logWarning('a msg', 'src');",
        "gs.logError('a msg', 'src');",
        "gs.print('a msg');",
    ]
});
