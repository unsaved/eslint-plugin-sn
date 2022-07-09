"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template
new (require("eslint").RuleTester)().run(baseName, require(`../rules/${baseName}`), {
    valid: [
        "gs.info('a msg');",
        'var msgStr = "Good day"; gs.info(msgStr, 2, 3);',
        "gs.debug('a {9} msg', 2);",
        "gs.warn('a {0} msg', 2, 3);",
        'gs.error("a {3} {2} msg", {a: 1});',
    ],
    invalid: [
        {
            code: "gs.debug();",
            errors: [{messageId}],
        },
        {
            code: "gs.info('a msg', 2);",
            errors: [{messageId}],
        },
        {
            code: 'gs.error("first", "second", "third");',
            errors: [{messageId}],
        }
    ]
});
