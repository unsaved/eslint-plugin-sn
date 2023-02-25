"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template

// Putting this up here because the slash-star screws up ability to comment out tests below.
const FIRST_TEMPLATE_LINE = '(function executeRule(current, previous /*null when async*/) {';

new (require("eslint").RuleTester)({ parserOptions: {ecmaVersion: 6} }).
 run(baseName, require(`../rules/${baseName}`), {
    valid: [
        {  // No declaration or assignment
            code: 'if (true) {(function() { function g() {} })();}',
            options: [{table: "table_for_message", paramCallVars: ["a", "b", "c"]}],
        },
        {  // No declaration or assignment
            code: 'gs.log("a msg", "src");',
            options: [{table: "table_for_message", paramCallVars: ["a", "b", "c"]}],
        },
        {  // Good IIFE though no assignment or declaration
            code: 'gs.log("a msg", "src");\n(function(){//V1\n})(b, a, c);',
            options: [{table: "table_for_message", paramCallVars: ["a", "b", "c"]}],
        },
        { // Good IIFE with isolated declaration
            code:
              'gs.log("a msg", "src");\n(function(x,y,z){//V2\nvar x = 3; })(b, a);',
            options: [{table: "msg_tbl1", paramCallVars: ["a", "b"]}],
        },
        { // Good IIFE with isolated assignment
            code:
              'gs.log("a msg", "src");\n(function(x,y,z){//V3\nx = 3; })(b, a);',
            options: [{table: "msg_tbl1", paramCallVars: ["a", "b"]}],
        },
        { // Good 0-param IIFE with isolated declaration
            code:
              'gs.log("a msg", "src");\n(function(x,y,z){//V7\nvar x = 3; })();',
            options: [{table: "msg_tbl1", paramCallVars: []}],
        },
        { // Good unused-params IIFE with isolated declaration
            code:
              'gs.log("a msg", "src");\n(function(){//V8\nvar x = 3; })(b, a);',
            options: [{table: "msg_tbl1", paramCallVars: ["a", "b"]}],
        },
        {  // SN-provided sys_script script template
            // eslint-disable-next-line prefer-template
            code: FIRST_TEMPLATE_LINE + '\t // Add your code here\n    var x1 = 2;\n\nx2 = 4;\n'
              + '})(current, previous);',
            options: [{table: "sys_script", paramCallVars: ["previous", "current"]}],
        },
        {  // function decl is nested inside a lower level IIFE
            code: 'if (true) {(function() { function g() {} })();}',
            options: [{table: "table_for_message", paramCallVars: ["a", "b", "c"]}],
        },
        { // Good arrow IIFE with isolated declaration
            code: 'gs.log("a msg", "src");\n((x,y,z)=>{//V4\nlet m = 3; })(b, a);',
            options: [{table: "msg_tbl1", paramCallVars: ["a", "b"]}],
        },
        { // Good arrow IIFE with isolated assignment
            code: 'gs.log("a msg", "src");\n((x,y,z)=>{//V5\nx = 3; })(b, a);',
            options: [{table: "msg_tbl1", paramCallVars: ["a", "b"]}],
        },
        { // Single-statement-shortcut arrow IIFE with isolated assignment
            code: 'gs.log("a msg", "src");\n((x,y,z)=>//V6\nx = 3)(b, a);',
            options: [{table: "msg_tbl1", paramCallVars: ["a", "b"]}],
        },
        { // Good unused-params arrow IIFE with isolated declaration
            code:
              'gs.log("a msg", "src");\n(()=>{//V9\nvar x = 3; })(b, a);',
            options: [{table: "msg_tbl1", paramCallVars: ["a", "b"]}],
        },
        { // Good single-statement unused-params arrow IIFE with isolated declaration
            code:
              'gs.log("a msg", "src");\n(()=>//V10\nx = 3)(b, a);',
            options: [{table: "msg_tbl1", paramCallVars: ["a", "b"]}],
        },
    ],
    invalid: [
        {
            code: 'var v1 = "one"; gs.log("a msg", "2");\n//I1',
            options: [{table: "table_for_msg", paramCallVars: ["p1", "p2"]}],
            errors: [{messageId}],
        },
        {
            code: 'v1 = "two"; gs.log("a msg", "2");\n//I2',
            options: [{table: "table_for_msg", paramCallVars: ["p1", "p2"]}],
            errors: [{messageId}],
        },
        {
            code: 'if (true) { var v1 = "one"; }\n gs.log("a msg", "2");\n//I3',
            options: [{table: "table_for_msg", paramCallVars: ["p1", "p2"]}],
            errors: [{messageId}],
        },
        {
            code: 'if (true) { v1 = "two"; }\ngs.log("a msg", "2");\n//I4',
            options: [{table: "table_for_msg", paramCallVars: ["p1", "p2"]}],
            errors: [{messageId}],
        },
        {  // No declaration or assignment
            code: 'if (true) { function g() {} }',
            options: [{table: "table_for_message", paramCallVars: ["a", "b", "c"]}],
            errors: [{messageId}],
        },
        {
            code: 'function f1() { return 3;}\n//I1',
            options: [{table: "table_for_msg", paramCallVars: ["p1", "p2"]}],
            errors: [{messageId}],
        },
        {
            code: "gs.log('a msg', 'src');\n(function(a,b){//I2\n})(p1, p1);\nvar va1 = 'one'",
            options: [{table: "table_for_msg", paramCallVars: ["p1"]}],
            errors: [{messageId}],
        },
        {
            code: "gs.log('a msg', 'src');\n(function(){})(p1, p3);",
            options: [{table: "table_for_msg", paramCallVars: ["p1", "p2"]}],
            errors: [{messageId}],
        },
        {
            code: "gs.log('a msg', 'src');\n(function(){})(p1, p2, p3);",
            options: [{table: "table_for_msg", paramCallVars: ["p1"]}],
            errors: [{messageId}],
        },
        {
            code: "gs.log('a msg', 'src');\n(()=>{})(p1, p3);",
            options: [{table: "table_for_msg", paramCallVars: ["p1", "p2"]}],
            errors: [{messageId}],
        },
    ]
});
