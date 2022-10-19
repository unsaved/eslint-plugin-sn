"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template
new (require("eslint").RuleTester)({ parserOptions: {ecmaVersion: 6} }).
  run(baseName, require(`../rules/${baseName}`), {
    valid: [
        'console.info("No \'new GlideRecord\' here");'
    ],
    invalid: [
        {
            code: 'let gr = new GlideRecord("table_name");',
            errors: [{messageId}],
        },
    ]
});
