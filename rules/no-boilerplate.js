"use strict";

const message = "Remove boilerplate comments.  Don't promote garbage in your scripts.";

const SN_BOILERPLATE_TEXTS = [
    // I am commenting out comments which may arguably be useful to retain
    /^Type appropriate comment here, and begin script below/, // *_script_client
    /^ populate the 'data' object/,  // sp_widget.script
    /^ e[.]g[.] data[.]table = [$]sp[.]getValue[(]'table'[)];/,  // sp_widget.script
    // /^ widget controller $/, // sp_widget.client_script
    /^[*] 1[.] Pre sensor: {2}You can change payload before it will be proccese/m, //prepost/sensors
    // /^parsing the json string to a json object/m, //prepost/sensors
    /^put your business logic here/, //prepost/multiple
 // /^you can return a message and a status, on top of the input variables that/, //prepost/multip
    /^[*] Pre execution: This script will run before the execution of the/m,  //prepos/preexec
    /^ add a string with variable name 'stringA'/, // prepost/preexec
    /^ add a list with variable name 'listA', value given must be a list/, // prepost/preexec
    /^ this will create a new table variable 'tableA'/, // prepost/preexec
    /^ this will add a second row to the previous table 'tableA'/, // prepost/preexec
    // /^use this method if you want the pattern not to be executed/, // prepost/preexec
    // /^must return the data at end/, // prepost/preexec
    /^[*] On Failure: You can do operations in case a pattern failed/m,   // prepost/onfail
    ///^[*] This script is executed before the Record is generated/,  // sc_cat_item_producer
    /^ Add your code here/,  // Many different types of scripts
    // /^ return the value to be put into the target field/,  // sys_transform_entry
    /^ implement resource here/,  // sys_ws_operation,
];

const messageId =  // eslint-disable-next-line prefer-template
  (require("path").basename(__filename).replace(/[.]js$/, "") + "_msg").toUpperCase();
const esLintObj = {
    meta: {
        type: "suggestion",
        docs: {
            description: "Platform-provided template comments are not for production",
            category: "Suggestions",
        },
        messages: { },
    },

    create: context => { return {
        Program: node => {
            if (context.getSourceCode().getAllComments().forEach(cmt => {
                if (SN_BOILERPLATE_TEXTS.some(bpRe => bpRe.test(cmt.value)))
                context.report({node, loc: cmt.loc, messageId});
            }));
        }
    }; }
};
esLintObj.meta.messages[messageId] = message;
module.exports = esLintObj;
