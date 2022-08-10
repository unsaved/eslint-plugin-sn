"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template
new (require("eslint").RuleTester)({ parserOptions: {ecmaVersion: 6} }).
  run(baseName, require(`../rules/${baseName}`), {
    valid: [
        "gs.log(`a msg\nmulti-line strings are ok`, 'src');",
    ],
    invalid: [
        {
            code: "gs.log(`a ${ref} msg`, 'src');",
            errors: [{messageId}],
        },
        {
            code: 'gs.log("${references} not within backtick still violate this rule", "src");',
            errors: [{messageId}],
        },
        {
            code: "gs.log('${1 + 2} not within backtick still violate this rule', 'src');",
            errors: [{messageId}],
        },
    ],
  });
