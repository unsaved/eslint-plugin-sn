"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template
new (require("eslint").RuleTester)().run(baseName, require(`../rules/${baseName}`), {
    valid: [
        'gs.info("Today in UTF is " + new GlideDate().getDisplayValue());'
    ],
    invalid: [
        {
            code: 'gs.log(gs.now() + " is from obsoleted function", "src");',
            errors: [{messageId}],
        },
    ]
});
