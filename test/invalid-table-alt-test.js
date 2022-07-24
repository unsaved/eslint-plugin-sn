"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
/* eslint-disable prefer-template */
const tableMessageId = (baseName + "_msg").toUpperCase() + "_table";
const altMessageId = (baseName + "_msg").toUpperCase() + "_alt";
/* eslint-enable prefer-template */
new (require("eslint").RuleTester)({settings: {testTable:"tea", ootbTables: {"fake":null}}}).
  run(baseName, require(`../rules/${baseName}`), {
    valid: [
    ],
    invalid: [
        {
            code: 'gs.log("Helo world", "src");',
            errors: [{messageId: tableMessageId}],
        },
    ]
});
new (require("eslint").RuleTester)({settings: {
    testTable: "tea",
    testAltScope: "altname",
    ootbTables: {"tea": ["other1", "other2"]},
  }}).
  run(baseName, require(`../rules/${baseName}`), {
    valid: [
    ],
    invalid: [
        {
            code: 'gs.log("Helo world", "src");',
            errors: [{messageId: altMessageId}],
        },
    ]
});
