"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template
new (require("eslint").RuleTester)({ parserOptions: {ecmaVersion: 6} }).
  run(baseName, require(`../rules/${baseName}`), {
    valid: [
        'function name(a, b) { gs.info("word"); }',
        'function name(a, b) { ["m","n"].forEach(w=>gs.info(w)); }',
         'const name = (a, b) => { gs.info("word");};',
    ],
    invalid: [
        {
            code: '(a, b) => { gs.info("word");}',
            errors: [{messageId}],
        }
    ]
});
