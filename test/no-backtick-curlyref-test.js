"use strict";

/* eslint-disable no-template-curly-in-string */
const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template
new (require("eslint").RuleTester)({ parserOptions: {ecmaVersion: 6} }).
  run(baseName, require(`../rules/${baseName}`), {
    valid: [
        "gs.log(`a msg\nmulti-line strings are ok`, 'src');",
        'gs.log("${references} not within backtick are ok", "src");',
        "gs.log('${references} in single-ticks are also ok', 'src');",
        'gs.log("non-expansion expressions like " + (1 + 2) + " are ok", "src");',
    ],
    invalid: [
        {
            code: "gs.log(`a ${ref} msg`, 'src');",
            errors: [{messageId}],
        },
        {
            code: "gs.log(`${1 + 2} within backtick violates this rule`, 'src');",
            errors: [{messageId}],
        },
    ],
  });
