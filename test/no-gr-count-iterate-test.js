"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template
new (require("eslint").RuleTester)().run(baseName, require(`../rules/${baseName}`), {
    valid: [
       'var gr = new GlideRecord("x"); if (gr.getRowCount() > 0){gr._next(); gs.info(gr.sys_id);}',
       'var gr = new GlideRecord("x"); if (gr._next()) gs.info(gr.sys_id);',
    ],
    invalid: [
        {
            code: 'var gr = new GlideRecord("x"); gs.info(gr.getRowCount() + " rows");',
            errors: [{messageId}],
        },
    ]
});
