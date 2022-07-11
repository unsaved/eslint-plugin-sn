"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template

// Putting this up here because the slash-star screws up ability to comment out tests below.
const FIRST_TEMPLATE_LINE = '(function executeRule(current, previous /*null when async*/) {';

new (require("eslint").RuleTester)().run(baseName, require(`../rules/${baseName}`), {
    valid: [
        {  // No declaration or assignment
            code: 'if (true) {(function() { function g() {} })();}',
            options: [{tables: ["table_for_message"], paramCallVars: ["a", "b", "c"]}],
        },
        {  // No declaration or assignment
            code: 'gs.log("a msg", "src");',
            options: [{tables: ["table_for_message"], paramCallVars: ["a", "b", "c"]}],
        },
        {  // Good IIFE though no assignment or declaration
            code: 'gs.log("a msg", "src");\n(function(){//V1\n})(b, a, c);',
            options: [{tables: ["table_for_message"], paramCallVars: ["a", "b", "c"]}],
        },
        { // Good IIFE with isolated declaration
            code:
              'gs.log("a msg", "src");\n(function(x,y,z){//V2\nvar x = 3; })(b, a);',
            options: [{tables: ["msg_tbl1", "msg_tbl2"], paramCallVars: ["a", "b"]}],
        },
        { // Good IIFE with isolated assignment
            code:
              'gs.log("a msg", "src");\n(function(x,y,z){//V3\nx = 3; })(b, a);',
            options: [{tables: ["msg_tbl1", "msg_tbl2"], paramCallVars: ["a", "b"]}],
        },
        {  // SN-provided sys_script script template
            code: FIRST_TEMPLATE_LINE + '\t // Add your code here\n    var x1 = 2;\n\nx2 = 4;\n'
              + '})(current, previous);',
            options: [{tables: ["sys_script"], paramCallVars: ["previous", "current"]}],
        },
        {  // function decl is nested inside a lower level IIFE
            code: 'if (true) {(function() { function g() {} })();}',
            options: [{tables: ["table_for_message"], paramCallVars: ["a", "b", "c"]}],
        },
    ],
    invalid: [
        {
            code: 'var v1 = "one"; gs.log("a msg", "2");\n//I1',
            options: [{tables: ["table_for_msg"], paramCallVars: ["p1", "p2"]}],
            errors: [{messageId}],
        },
        {
            code: 'v1 = "two"; gs.log("a msg", "2");\n//I1',
            options: [{tables: ["table_for_msg"], paramCallVars: ["p1", "p2"]}],
            errors: [{messageId}],
        },
        {
            code: 'if (true) { var v1 = "one"; }\n gs.log("a msg", "2");\n//I1',
            options: [{tables: ["table_for_msg"], paramCallVars: ["p1", "p2"]}],
            errors: [{messageId}],
        },
        {
            code: 'if (true) { v1 = "two"; }\ngs.log("a msg", "2");\n//I1',
            options: [{tables: ["table_for_msg"], paramCallVars: ["p1", "p2"]}],
            errors: [{messageId}],
        },
        {  // No declaration or assignment
            code: 'if (true) { function g() {} }',
            options: [{tables: ["table_for_message"], paramCallVars: ["a", "b", "c"]}],
            errors: [{messageId}],
        },
        {
            code: 'function f1() { return 3;}\n//I1',
            options: [{tables: ["table_for_msg"], paramCallVars: ["p1", "p2"]}],
            errors: [{messageId}],
        },
        {
            code: "gs.log('a msg', 'src');\n(function(a,b){//I2\n})(p1, p1);\nvar va1 = 'one'",
            options: [{tables: ["table_for_msg"], paramCallVars: ["p1"]}],
            errors: [{messageId}],
        },
        {
            code: "gs.log('a msg', 'src');\n(function(){})(p1, p3);",
            options: [{tables: ["table_for_msg"], paramCallVars: ["p1", "p2"]}],
            errors: [{messageId}],
        },
        {
            code: "gs.log('a msg', 'src');\n(function(){})(p1, p2, p3);",
            options: [{tables: ["table_for_msg"], paramCallVars: ["p1"]}],
            errors: [{messageId}],
        },
    ]
});
