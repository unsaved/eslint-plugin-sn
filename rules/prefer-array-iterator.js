"use strict";

/**
 * In attempt to get this covering the most common use cases, I'm purposefully checking only
 * for cases where has inline for tst 'i < x.length' or 'x.length > i'.
 * If code (for efficiency or index base preference or whatever) sets the length with an
 * intermediate variable or uses 1-base indexing with test 'i <= x.length' then things won't
 * work.
 *
 * We purposefully do not match partial loops (not iterating over every member) nor reverse
 * order loops because though in many cases Array iterators are still superior for this, we can't
 * confidently recommend this without much more detailed checking.
 */
const message = "Consider using Array.forEach, .every, or .some operator.  "
  + "Unlike traditional 'for (i = 0; i < arr.length...', these safely isolate the iteration "
  + "variables and all other variables.";
const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();

const esLintObj = {
    meta: {
        type: "suggestion",
        docs: {
            description:
              "Encourage to use Array.forEach/.every/.some rather than traditional for loop",
            category: "Suggestions",
        },
        messages: { },
    },

    create: context => { return {
        ForStatement: node => {
            if (node.init === null || !node.init.right) return;
            /* LHS harder to use than the other segments, because it may be a VariableDeclaration
             * or an AssigmentExpression.
            if (node.init.type !== "AssignmentExpression" || node.init.operator !== "=") return; */
            if (node.init.right.type !== "Literal" || node.init.right.value !== 0) return;
            if (!node.test.left || !node.test.operator || !node.test.right) return;
            if (node.test.left.type === "Identifier"  // i < arr.length case
              && node.test.right.type === "MemberExpression"
              && node.test.right.object !== undefined
              && node.test.right.object.type === "Identifier"
              && node.test.right.property !== undefined
              && node.test.right.property.name === "length"
              && node.test.operator === "<"
              ||
              node.test.right.type === "Identifier"  // arr.length > i case
              && node.test.left.type === "MemberExpression"
              && node.test.left.object !== undefined
              && node.test.left.object.type === "Identifier"
              && node.test.left.property !== undefined
              && node.test.left.property.name === "length"
              && node.test.operator === ">")
                context.report({node, messageId});
        }
    }; }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
