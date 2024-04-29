"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template
new (require("eslint").RuleTester)().run(baseName, require(`../rules/${baseName}`), {
    valid: [
       'if ($window.member === 5) console.warn("Hi");',
       'if ($window === 3) console.info("hey");',
       '$window = 4;',

       'if ($interval === 3) console.info("hey");',
       '$interval = 4;',
       'if ($interval.member === 5) console.warn("Hi");',

       'if ($location === 3) console.info("hey");',
       '$location = 4;',
       'if ($location.member === 5) console.warn("Hi");',

       'if ($timeout === 3) console.info("hey");',
       '$timeout = 4;',
       'if ($timeout.member === 5) console.warn("Hi");',

       'if ($document === 3) console.info("hey");',
       '$document = 4;',
       'if ($document.member === 5) console.warn("Hi");',

       'if (other.window === 3) console.info("hey");',
       'other.document = 4;',
       'if (other.document === 5) console.warn("Hi");',
    ],
    invalid: [
        {
            code: 'if (window === 3) console.info("hey");',
            errors: [{messageId}],
        },
        {
            code: 'window = 4;',
            errors: [{messageId}],
        },
        {
            code: 'if (window.member === 5) console.warn("Hi");',
            errors: [{messageId}],
        },
        {
            code: 'if (window.document === 5) console.warn("Hi");',
            errors: [{messageId}],
        },
        {
            code: 'if (window.setInterval === 5) console.warn("Hi");',
            errors: [{messageId}],
        },
        {
            code: 'if (window.location === 5) console.warn("Hi");',
            errors: [{messageId}],
        },
        {
            code: 'if (window.setTimeout === 5) console.warn("Hi");',
            errors: [{messageId}],
        },

        {
            code: 'if (document === 3) console.warn("Hi");',
            errors: [{messageId}],
        },
        {
            code: 'document = 4;',
            errors: [{messageId}],
        },
        {
            code: 'if (document.member === 5) console.warn("Hi");',
            errors: [{messageId}],
        },

        {
            code: 'if (setInterval === 3) console.warn("Hi");',
            errors: [{messageId}],
        },
        {
            code: 'setInterval = 4;',
            errors: [{messageId}],
        },
        {
            code: 'if (setInterval.member === 5) console.warn("Hi");',
            errors: [{messageId}],
        },

        {
            code: 'if (location === 3) console.warn("Hi");',
            errors: [{messageId}],
        },
        {
            code: 'location = 4;',
            errors: [{messageId}],
        },
        {
            code: 'if (location.member === 5) console.warn("Hi");',
            errors: [{messageId}],
        },

        {
            code: 'if (setTimeout === 3) console.warn("Hi");',
            errors: [{messageId}],
        },
        {
            code: 'setTimeout = 4;',
            errors: [{messageId}],
        },
        {
            code: 'if (setTimeout.member === 5) console.warn("Hi");',
            errors: [{messageId}],
        },
    ]
});
