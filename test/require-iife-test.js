"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js/, "");
new (require("eslint").RuleTester)().run(baseName, require(`../rules/${baseName}`), {
    valid: [
        {
            code: "gs.log('a msg', 'src');",
        },
    ],
    invalid: [
        {
            code: "gs.log('a msg', 2, 3);",
            errors: [{messageId: "REQUIRE_IIFE_MSG"}],
        },
    ]
});
