"use strict";

/**
 * If current design doesn't work then copy relevant parts, like function 'getFunctionNodeFromIIFE'
 * and all dependency modules for that, from OOTB "node_modules/eslint/lib/rules/wrap-iife.js".
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

const message =
  "For {{tables}} table scriptlets you must pass {{paramNames}} to IIFE param(s)";
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
                tables: {
                    type: "array",
                    items: {
                        type: "string"
                    },
                    uniqueItems: true
                },
                paramNames: {
                    /* IMPORTANT!  If set paramNames then these variables must be accessible to
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
        let assignmentCount = 0;
        let goodParams = false;
        const reqParams = context.options[0].paramNames;
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
console.warn(`Comparison to ${reqParams} gives: ${arraysEq(reqParams, rtParams, false)}`);
                if (arraysEq(reqParams, rtParams, false)) goodParams = true;
            }, AssigmentExpression: node => {
                if (context.getScope().type === "global" && node.id.type === "Identifer")
                    assignmentCount++;
            }, VariableDeclarator: () => {
                if (context.getScope().type === "global") assignmentCount++;
            }, onCodePathEnd: (codePath, node) => {
                if (node.type !== "Program") return;
console.warn(`asscnt ${assignmentCount} and iifect ${iifeCount}`);
                if (assignmentCount > 0 && iifeCount === 0
                  || iifeCount > 0 && !goodParams)
                    context.report({node, messageId, data: {
                        tables: context.options[0].tables,
                        paramNames: context.options[0].paramNames,
                    }});
            },
        };
    }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
