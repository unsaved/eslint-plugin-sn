"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const msgKey = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template
new (require("eslint").RuleTester)().run(baseName, require(`../rules/${baseName}`), {
    valid: [
    ],
    invalid: [
        {
            code: 'x = "123456789012345678901234567890ab";',
            errors: [{messageId: msgKey}],
        },
        {
            code: 'if (x === "123456789012345678901234567890ab") throw new Error("bad");',
            errors: [{messageId: msgKey}],
        },
        {
            code: 'gr.addQuery("sys_id", "123456789012345678901234567890ab");',
            errors: [{messageId: msgKey}],
        }
    ]
});
