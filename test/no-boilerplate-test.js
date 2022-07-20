"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template

new (require("eslint").RuleTester)().run(baseName, require(`../rules/${baseName}`), {
    valid: [
        "console.info('a msg');",
        "/* star comment */",
        "// slash comment",
        "/*\n e.g. data.table = $sp.getValue('table');*/",
        'console.log("pre");\n//slashy\n/**Multi\n* line*/\nconsole.log("post");\n',
    ],
    invalid: [
        {
            code: "// e.g. data.table = $sp.getValue('table');",
            errors: [{messageId}],
        },
        {
            code:
         "/*Helo\n\n* 1. Pre sensor:  You can change payload before it will be proccese/sufix*/",
            errors: [{messageId}],
        }
    ]
});
