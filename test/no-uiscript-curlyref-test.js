"use strict";

/* eslint-disable no-template-curly-in-string */
const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
new (require("eslint").RuleTester)({ parserOptions: {ecmaVersion: 6} }).
  run(baseName, require(`../rules/${baseName}`), {
    valid: [
        "gs.log(`a msg\nmulti-line strings are ok`, 'src');",
        "gs.log(`a ${ref} msg`, 'src');",
        'gs.log("${references} not within backtick still violate this rule", "src");',
        "gs.log('${1 + 2} not within backtick still violate this rule', 'src');",
    ],
    invalid: [],
  });
