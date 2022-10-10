"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template
new (require("eslint").RuleTester)().run(baseName, require(`../rules/${baseName}`), {
    valid: [
        'var gr = new GlideRecord("x"); var retval = gr.next()',
        'var r;\nr = new GlideRecord("x"); if (r._next()) console.log("good");',
        'var retval = current.deleteRecord()',
        'if (previous.deleteRecord()) console.log("good");',
    ],
    invalid: [
        {
            code: 'var gr = new GlideRecord("x"); gr.next();',
            errors: [{messageId}],
        },
        {
            code: 'var r;\nr = new GlideRecord("x"); r._next();',
            errors: [{messageId}],
        },
        {
            code: 'var unrelated = 3;\n\nfunction other() {\n'
              + '    var r;\n    r = new GlideRecord("x");\n    r.deleteRecord();\n}',
            errors: [{messageId}],
        },
        {
            code: 'var unrelated = 3;\n\nvar fn = function() {\n'
              + '    var r;\n    r = new GlideRecord("x");\n    r.insert();\n};',
            errors: [{messageId}],
        },
        {
            code: 'if (true) {\nvar r = new GlideRecord("x"); r.update();\n}',
            errors: [{messageId}],
        },
        {
            code: 'if (true) {\nvar r; r = new GlideRecord("x"); r.get();\n}',
            errors: [{messageId}],
        },
        {
            code: 'current.deleteRecord();',
            errors: [{messageId}],
        },
        {
            code: 'var unrelated = 3;\n\nfunction other() {\n'
              + '    previous.deleteRecord();\n}',
            errors: [{messageId}],
        },
        {
            code: 'if (true) {\ncurrent.update()\n}',
            errors: [{messageId}],
        },
    ]
});
