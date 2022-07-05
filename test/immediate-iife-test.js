"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template
new (require("eslint").RuleTester)().run(baseName, require(`../rules/${baseName}`), {
    valid: [
        // good IIFE
        '(function() { console.info("V0"); })();',
        // root-level assignment, but separated by other statement
        'var x=0;\nvar afn = function() { console.info("V1"); };\n' +
          'if (x === 0) console.warn("It stil zero");\nafn(x);',
        // block-level assignment, but separated by other statement
        'var x=0;\nif (true) {\n    var afn = function() { console.info("V2"); };\n' +
          '    if (x === 0) console.warn("It stil zero");\n    afn(x);}',
        // root-level traditional, but separated by other statement
        'var x=0;\nfunction afn() { console.info("V3"); }\n' +
          'if (x === 0) console.warn("It stil zero");\nafn(x);',
        // block-level traditional, but separated by other statement
        'var x=0;\nif (true) {\n    function afn() { console.info("V4"); }\n' +
          '    if (x === 0) console.warn("It stil zero");\n    afn(x);}',
    ],
    invalid: [
        { // root-level assignment
            code: 'var x=0;\nvar afn = function() { console.info("I1"); };\nafn(x);',
            errors: [{messageId}],
        },
        { // block-level assignment
            code: 'var x=0;\nif (true) {\n    '
              + 'var afn = function() { console.info("I2"); };\n    afn(x);}',
            errors: [{messageId}],
        },
        { // root-level traditional
            code: 'var x=0;\nfunction afn() { console.info("I3"); }\nafn(x);',
            errors: [{messageId}],
        },
        { // block-level traditional
            code: 'var x=0;\nif (true) {\n    function afn() { console.info("I4"); }\n    afn(x);}',
            errors: [{messageId}],
        },
    ]
});
