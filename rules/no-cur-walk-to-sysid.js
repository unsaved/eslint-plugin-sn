"use strict";

const message = "Don't dot-walk from current to sysid";
const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();
const esLintObj = {
    meta: {
        type: "problem",
        docs: {
            description: 'Instead of dot-walking from current to x.sys_id, just dot-walk to x',
            category: "Possible Problems",
        },
        messages: { },
    },

    create: context => {
        return {
            MemberExpression: (node) => {
                if (!node.property || node.property.type !== "Identifier"
                  || node.property.name !== "sys_id" || !node.object || !node.object.property)
                    return;
                let prevSeg = node.object;
                while (prevSeg.property && prevSeg.property.type === "Identifier")
                    prevSeg = prevSeg.object;
                if (!prevSeg.property && prevSeg.type === "Identifier"
                  && prevSeg.name === "current")
                    context.report({node, messageId});
            },
        };
    }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
