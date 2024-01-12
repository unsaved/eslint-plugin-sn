"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template
new (require("eslint").RuleTester)({ parserOptions: {ecmaVersion: 6} }).
  run(baseName, require(`../rules/${baseName}`), {
    valid: [
        // This one is OOTB boilerplate:
`api.controller=function() {
  /* widget controller */
  var c = this;
};`,
        `api.controller = function(spModal, $scope, $id) {
         console.warn("Got", $spModal, $scope, $id);\n};`,
    ],
    invalid: [
        {
            code: 'api.other=function() {\n    console.info("hi");\n};',
            errors: [{messageId}],
        },
        {
            code: 'dummy=function() {\n    console.info("hi");\n};',
            errors: [{messageId}],
        },
        /*
        {
            code: 'function() {\n    console.info("hi");\n}',  // invalid JavaScript scriptlet
            errors: [{messageId}],
        },
        */
    ]
});
