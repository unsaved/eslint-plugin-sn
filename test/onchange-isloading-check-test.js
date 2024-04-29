"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template
new (require("eslint").RuleTester)().run(baseName, require(`../rules/${baseName}`), {
    valid: [
       `function onChange(control, oldValue, newValue, isLoading, isTemplate) {
            if (control !== null) console.info("control is set");
            if (isLoading || newValue === '' /* cmt */ && otherThing) {
                return;
            }
            console.info("All good");
        }`
    ],
    invalid: [
        {
            code: `function onChange(control, oldValue, newValue, isLoading, isTemplate) {
            if (control !== null) console.info("control is set");
            if (oldValue || newValue === '' /* cmt */ && otherThing) {
                return;
            }
            console.info("All good");
        }`,
            errors: [{messageId}],
        },
        {
            code: `function onChange(control, oldValue, newValue, other, isTemplate) {
            if (control !== null) console.info("control is set");
            if (isLoading || newValue === '' /* cmt */ && otherThing) {
                return;
            }
            console.info("All good");
        }`,
            errors: [{messageId}],
        },
    ]
});
