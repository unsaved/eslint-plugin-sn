"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template
new (require("eslint").RuleTester)().run(baseName, require(`../rules/${baseName}`), {
    valid: [
        'var MtClass = Class.create();\nMtClass.prototype = {\n    type: "MtClass"\n};',
    ],
    invalid: [
        {
            code: 'var AClass = Class.create();' +
              'AClass.prototype = {\n    echo: function() { gs.log("hi", /*acmt*/ "src"); }\n}',
            errors: [{messageId}],
        },
        {
            code: 'var BClass = Class.create();\nBClass.prototype = {\n    type: "BClass"\n};\n' +
              'BClass.prototype.echo = function() { gs.log("hi", /*bcmt*/ "src"); };',
            errors: [{messageId}],
        },
    ]
});
