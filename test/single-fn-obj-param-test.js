"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template
new (require("eslint").RuleTester)({ parserOptions: {ecmaVersion: 6} }).
  run(baseName, require(`../rules/${baseName}`), {
    valid: [
        {
            code: '({a, b}) => { gs.info("word"); }',
            options: [{table: "msg_tbl1"}],
        }, {
            code:'function fn({x, y}) { return x + x; }',
            options: [{table: "msg_tbl1"}],
        }, {
            code:'(function({x, y}) { return x + x; })',
            options: [{table: "msg_tbl1"}],
        }, {
            code: '({a, b}) => { gs.info("word"); }',
            options: [{table: "msg_tbl1"}],
        },
        {
            code: '({}) => { gs.info("word"); }',
            options: [{table: "msg_tbl1"}],
        }, {
            code:'(function({}) { return x + x; })',
            options: [{table: "msg_tbl1"}],
        }, {
            code: '({}) => { gs.info("word"); }',
            options: [{table: "msg_tbl1"}],
        }, {
            code: '// a comment\n({}) => { gs.info("word"); }',
            options: [{table: "msg_tbl1"}],
        }, {  // eslint-disable-next-line no-useless-concat
            code: '/' + '* a comment *' + '/({}) => { gs.info("word"); }',
            options: [{table: "msg_tbl1"}],
        }, {  // eslint-disable-next-line no-useless-concat
            code: '({}) => { gs.info("word"); }\n/' + '* a comment *' + '/',
            options: [{table: "msg_tbl1"}],
        },
    ],
    invalid: [
        {
            code: '({a, b}) => { gs.info("word");}\nlet x = 3;',
            options: [{table: "msg_tbl1"}],
            errors: [{messageId}],
        },
        {
            code: 'x = ({a}) => { gs.info("word"); }',
            options: [{table: "msg_tbl1"}],
            errors: [{messageId}],
        }, {
            code: 'const x = ({a}) => { gs.info("word"); }',
            options: [{table: "msg_tbl1"}],
            errors: [{messageId}],
        }, {
            code: 'let x = ({a}) => { gs.info("word"); }',
            options: [{table: "msg_tbl1"}],
            errors: [{messageId}],
        }, {
            code: 'if (true) function fn({a}) { gs.info("word"); }',
            options: [{table: "msg_tbl1"}],
            errors: [{messageId}],
        }, {
            code: 'if (true) (function({a}) { gs.info("Hea"); });',
            options: [{table: "msg_tbl1"}],
            errors: [{messageId}],
        }, {
            code: '',
            options: [{table: "msg_tbl1"}],
            errors: [{messageId}],
        }, {  // eslint-disable-next-line no-useless-concat
            code: '/' + '* star comment *' + '/',
            options: [{table: "msg_tbl1"}],
            errors: [{messageId}],
        }, {
            code: '// slash comment',
            options: [{table: "msg_tbl1"}],
            errors: [{messageId}],
        }, {
            code: 'let x;',
            options: [{table: "msg_tbl1"}],
            errors: [{messageId}],
        },

        {
            code: '({a, b}, {c, d}) => { gs.info("word"); }',
            options: [{table: "msg_tbl1"}],
            errors: [{messageId}],
        }, {
            code:'(function({x, y}, {a, b}) { return x + x; })',
            options: [{table: "msg_tbl1"}],
            errors: [{messageId}],
        }, {
            code: '(a, b) => { gs.info("word"); }',
            options: [{table: "msg_tbl1"}],
            errors: [{messageId}],
        },
        {
            code: '() => { gs.info("word"); }',
            options: [{table: "msg_tbl1"}],
            errors: [{messageId}],
        }, {
            code:'(function() { return x + x; })',
            options: [{table: "msg_tbl1"}],
            errors: [{messageId}],
        }, {
            code: '(a) => { gs.info("word"); }',
            options: [{table: "msg_tbl1"}],
            errors: [{messageId}],
        },
    ]
});
