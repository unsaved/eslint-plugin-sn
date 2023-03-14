"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template
new (require("eslint").RuleTester)({ parserOptions: {ecmaVersion: 6} }).
  run(baseName, require(`../rules/${baseName}`), {
    valid: [
        'gs.info("word");',
        "gs.info('word');",
    ],
    invalid: [
        {
            code: 'gs.info(`word`);',
            errors: [{messageId}],
        }
    ]
});
