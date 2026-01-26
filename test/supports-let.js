"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
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
