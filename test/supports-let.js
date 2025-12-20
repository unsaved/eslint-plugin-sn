"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template
new (require("eslint").RuleTester)({ parserOptions: {ecmaVersion: 6} }).
  run(baseName, require(`../rules/${baseName}`), {
    valid: [ "dummy" ],
    invalid: [ ]
});
new (require("eslint").RuleTester)({ parserOptions: {ecmaVersion: 5} }).
  run(baseName, require(`../rules/${baseName}`), {
    valid: [{ code: "dummy", options: ["invert"]} ],
    invalid: [ ]
});
