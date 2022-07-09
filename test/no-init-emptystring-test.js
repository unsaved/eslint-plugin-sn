"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template
new (require("eslint").RuleTester)({ parserOptions: {ecmaVersion: 6} }).
  run(baseName, require(`../rules/${baseName}`), {
    valid: [
        "const x = '';",
        'if (today === "Tuesday") {\n    const y = "";\n    console.log("go");\n}',
        'const x = "Good", y = "";',
    ],
    invalid: [
        {
            code: 'let x = "";',
            errors: [{messageId}],
        },
        {
            code: "var x = '';",
            errors: [{messageId}],
        },
        {
            code: 'var x = "good", y = "";',
            errors: [{messageId}],
        },
        {
            code: 'if (today === "Tuesday") {\n    let y = "";\n    console.log("go");\n}',
            errors: [{messageId}],
        }
    ]
});
