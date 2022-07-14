"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template
new (require("eslint").RuleTester)({settings: {testTable:"tea"}}).
  run(baseName, require(`../rules/${baseName}`), {
    valid: [
    ],
    invalid: [
        {
            code: 'gs.log("Helo world", "src");',
            errors: [{messageId}],
        },
    ]
});
