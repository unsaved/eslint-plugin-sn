"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template

new (require("eslint").RuleTester)().run(baseName, require(`../rules/${baseName}`), {
    valid: [
        {
            code: 'var p1=1, p2=2;\ngs.log("a msg", "src");\n(function(a, a){//V1\n})(p2, p1);',
            options: [{tables: ["sys_script_include"], paramNames: ["p1", "p2"]}],
        },
        {
            code: 'gs.log("a msg", "2");\n//I1',
            options: [{tables: ["sys_script_include"], paramNames: ["p1", "p2"]}],
            errors: [{messageId}],
        },
        {  // SN-provided sys_script script template
            code: '(function executeRule(current, previous /*null when async*/) {'
              + '\t // Add your code here\n    gs.info("All is well", "scp");\n\n'
              + '})(current, previous);',
            options: [{tables: ["sys_script_include"], paramNames: ["previous", "current"]}],
            errors: [{messageId}],
        },
    ],
    invalid: [
        {
            code: 'var v1 = "one"; gs.log("a msg", "2");\n//I1',
            options: [{tables: ["sys_script_include"], paramNames: ["p1", "p2"]}],
            errors: [{messageId}],
        },
        {
            code: "var p1=1;\ngs.log('a msg', 'src');\n(function(a,b){//I2\n})(p1, p1);",
            options: [{tables: ["sys_script_include"], paramNames: ["p1"]}],
            errors: [{messageId}],
        },
        {
            code: "var p1=1, p3=3;\ngs.log('a msg', 'src');\n(function(a,b){})(p1, p3);",
            options: [{tables: ["sys_script_include"], paramNames: ["p1", "p3"]}],
            errors: [{messageId}],
        },
        {
            code: "var p1=1,p2=2,p3=3;\ngs.log('a msg', 'src');\n(function(a,b,c){})(p1, p2, p3);",
            options: [{tables: ["sys_script_include"], paramNames: ["p1"]}],
            errors: [{messageId}],
        },
        {
            code: 'var p1=1, p2=2;\nif (true) {\n    (function(a, a){//V1\n      })(p1, p2);\n}',
            options: [{tables: ["sys_script_include"], paramNames: ["p1", "p2"]}],
            errors: [{messageId}],
        },
    ]
});
