"use strict";

const baseName = require("path").basename(__filename).replace(/-test[.]js$/, "");
const messageId = (baseName + "_msg").toUpperCase();  // eslint-disable-line prefer-template
new (require("eslint").RuleTester)().run(baseName, require(`../rules/${baseName}`), {
    valid: [
      'var ar = ["a", "b", "c"]; ar.forEach(function(el) { console.info(el); });',
      // Non-entire iteration not so easy with Array iterators
      'var ar = ["a", "b", "c"]; for (i = 0; i < ar.length - 1; i++)\nconsole.info(ar[i]);',
      // Non-entire iteration not so easy with Array iterators
      'var ar = ["a", "b", "c"]; for (i = 1; i < ar.length - 1; i++)\nconsole.info(ar[i]);',
      // Array iterators would require a reverse sort to iterate in reverse order
      'var ar = ["a", "b", "c"]; for (i = ar.length - 1; i >= 0; i--)\nconsole.info(ar[i]);',
      // Non-entire iteration not so easy with Array iterators
      'var ar = ["a", "b", "c"]; for (i = 0; ar.length - 1 > i; i++)\nconsole.info(ar[i]);',
      'var ar = ["a", "b", "c"]; for (i = ar.length - 1; 0 <= i; i--)\nconsole.info(ar[i]);',
      // No initialization clause
      'var ar = ["a", "b", "c"]; i = 0; for (; i < ar.length; i++); console.info(ar[i]);',
    ],
    invalid: [
        {
            code: 'var ar = ["a", "b", "c"]; '
              + 'for (i = 0; i < ar.length; i++)\nconsole.info(ar[i]);',
            errors: [{messageId}],
        },
        {
            code: 'var ar = ["a", "b", "c"]; '
              + 'for (i = 0; ar.length > i; i++)\nconsole.info(ar[i]);',
            errors: [{messageId}],
        },
    ]
});
