"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template
new (require("eslint").RuleTester)().run(baseName, require(`../rules/${baseName}`), {
    valid: [
       "gs.info(current.sys_id);",
       "gs.info(other.alpha.sys_id);",
       "gs.info(current.alpha.other);",
    ],
    invalid: [
        {
            code: "gs.info(current.alpha.sys_id);",
            errors: [{messageId}],
        },
        {
            code: "gs.info(current.alpha.beta.sys_id);",
            errors: [{messageId}],
        },
        {  // Though there's a more serious problem here, developer has still dot-walked to a sysid:
            code: "gs.info(current.alpha.sys_id.other);",
            errors: [{messageId}],
        },
    ]
});
