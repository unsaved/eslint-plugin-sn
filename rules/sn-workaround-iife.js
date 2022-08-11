"use strict";

/**
 * IF an IIFE exists, we need to check that its params are good, but there is no reason to
 * explicitly check for existence of IIFE since ultimate goal is to prevent root-level assignments
 * and declarations.
 *
 * Since this is executed by a direct ESLint script, we have no control over logging redirection.
 * We don't want debug messages mixing in with stdout, so log at level warning for debugging.
 */

/*
 * May not work right for undefined elements within elements, since JSON doesn't support undefineds.
 *
 * @returns true if the array contents are equivalent
 */
const arraysEq = (a1, a2, ordered=true) => {
    if (a1 === null && a2 === null) return true;
    if (a1 === undefined && a2 === undefined) return true;
    if (!Array.isArray(a1) && a1 !== undefined && a1 !== null)
        throw new Error(`arrayCf got non-array input a1: ${typeof a1}`);
    if (!Array.isArray(a2) && a2 !== undefined && a2 !== null)
        throw new Error(`arrayCf got non-array input a2: ${typeof a2}`);
    if (!ordered) {
        a1 = a1.slice();
        a2 = a2.slice();
        a1.sort();
        a2.sort();
    }
    return JSON.stringify(a1) === JSON.stringify(a2);
};

/**
 * @returns boolean if ancestry has a FunctionDeclaration before any FunctionExpression
 */
const hasFnAncestor = ctx =>
    ctx.getAncestors().some(node =>
        node.type === "FunctionExpression" || node.type === "FunctionDeclaration"
    );

const message =
  "For {{table}} scriptlets you must implement top-level IIFE passing param(s) '{{paramCallVars}}'";
const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();

const esLintObj = {
    meta: {
        type: "problem",
        docs: {
            description:
              "Many ServiceNow scriptlet types need an IIFE to protect from variable scope leaks",
            category: "Possible Problems",
        },
        schema: [{
            type: "object",
            properties: {
                table: { type: "string", },
                paramCallVars: {
                    /* IMPORTANT!  If set paramCallVars then these variables must be accessible to
                     * pass to the function.  Since table-specific this would normally be done
                     * through snglobals "tableSpecifics.json" list.
                     * For end user customization, just add globals items to the sneslintrc.json. */
                    type: "array",
                    items: {
                        type: "string"
                    },
                    uniqueItems: true
                },
            },
            additionalProperties: false
        }],
        messages: { },
    },

    create: context => {
        let iifeCount = 0;
        let assignAndDeclCount = 0;
        let goodParams = false;
        const reqParams = context.options[0].paramCallVars;
        return {
            CallExpression: node => {
                const callee = node.callee;
                if (callee.type !== "FunctionExpression") return;
                const rtParams = node.arguments.map(p=>p.name);
                //console.debug(context.getSourceCode().getText(node.callee.body));
                if (node.parent.parent.type !== "Program") return;  // not at block level 0/root
                if (context.getScope().type !== "global") return;  // inside an internal function
                //console.debug("actual", rtParams, "vs.",
                  //["p1", "p2"], "=", arraysEq(["p1","p2"], rtParams, false));
                iifeCount++;
                if (arraysEq(reqParams, rtParams, false)) goodParams = true;
            }, AssignmentExpression: () => {
                if (!hasFnAncestor(context)) assignAndDeclCount++;
            }, VariableDeclarator: () => {
                if (!hasFnAncestor(context)) assignAndDeclCount++;
            }, FunctionDeclaration: () => {
                if (!hasFnAncestor(context)) assignAndDeclCount++;
            }, onCodePathEnd: (codePath, node) => {
                if (node.type !== "Program") return;
                console.warn('IIFE check counts.  '
                  + `assg ${assignAndDeclCount}, iife ${iifeCount}, goodPs ${goodParams}`);
                if (assignAndDeclCount === 0 && iifeCount === 0) return;  // No IIFE ok
                if (assignAndDeclCount > 0 || !goodParams)
                    context.report({node, messageId, data: {
                        table: context.options[0].table,
                        paramCallVars: context.options[0].paramCallVars,
                    }});
            },
        };
    }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
