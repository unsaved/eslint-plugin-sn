"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template
new (require("eslint").RuleTester)().run(baseName, require(`../rules/${baseName}`), {
    valid: [
        'var gr = new GlideRecord("x"); if (!gr.get()) throw "1"; if (!gr.update()) throw "2";',
        'if (!gr.deleteRecord()) throw new Error("delete failed");'
    ],
    invalid: [
        {
            code:
              'if (!current.update()) throw new Error("update failed");',
            errors: [{messageId}],
        },
        {
            code: '(function() {\nif (!current.update()) ' +
              'throw new Error("update failed");\n})(previous, current);',
            errors: [{messageId}],
        },
        {
            code: 'function nestedFn() {\n' +
              'if (!current.update()) throw new Error("update failed");\n' +
              '}\n\nnestedFn();',
            errors: [{messageId}],
        },
        {
            code: '(function() {\nfunction nestedFn() {\n' +
              'if (!current.update()) throw new Error("update failed");' +
              '\n}\n\nnestedFn();\n})(previous, current);',
            errors: [{messageId}],
        },
    ]
});
