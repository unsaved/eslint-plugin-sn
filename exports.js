"use strict";
/* eslint-disable max-len */
const { isPlainObject } = require("@admc.com/apputil");
const path = require("path");
const fs = require("fs");
const globalsDir = require("./lib/resolveGlobalsDir");
const jsonEasyStrip = require("json-easy-strip");
if (process.env.DEBUG) console.debug(`Using globalsDir '${globalsDir}'`);

/**
 * Output are just the 'gName: true' entries,not the "globals" keyword for the plain object
 */
function globalsFromFiles(...params) {
    const fName = "globalsFromFiles";
    const pObj = {};
    params.forEach(baseName => {
        let i, fp;
        fp = path.join(globalsDir, `${baseName}.txt`);
        if (!fs.existsSync(fp))
            throw new Error(`${fName} does not find file '${fp}'`);
        i = 0;
        fs.readFileSync(fp, "utf8").replace(/\r/g, "").split("\n").forEach(line => {
            i++;
            const s = line.trim();
            if (s === "" || s[0] === "#" || s.startsWith("//")) return;
            if (/\s/.test(line))
                throw new Error(`${fName} gets malformatted line '${fp}':${i}  ${line}`);
            pObj[s] = false;
        });
        fp = path.join(globalsDir, `${baseName}-local.txt`);
        if (!fs.existsSync(fp)) return;
        i = 0;
        fs.readFileSync(fp, "utf8").replace(/\r/g, "").split("\n").forEach(line => {
            i++;
            const s = line.trim();
            if (s === "" || s[0] === "#" || s.startsWith("//")) return;
            if (/\s/.test(line))
                throw new Error(`${fName} gets malformatted line '${fp}':${i}  ${line}`);
            pObj[s] = false;
        });
    });
    return pObj;
}

let tableSpecificMap, fp;
fp = path.join(globalsDir, "tableSpecifics.json");
if (!fs.existsSync(fp))
    throw new Error(`SN Plugin does not find file 'tableSpecifics.json'`);
try {
    tableSpecificMap = jsonEasyStrip(fp);
} catch (parseE) {
    throw new Error(`Failed to parse JSON from '${fp}': ${parseE.message}`);
}
fp = path.join(globalsDir, "tableSpecifics-local.json");
if (fs.existsSync(fp)) try {
    tableSpecificMap = {...tableSpecificMap, ...jsonEasyStrip(fp)};
} catch (parseE) {
    throw new Error(`Failed to parse JSON from '${fp}': ${parseE.message}`);
}

const allRules = require("requireindex")(path.join(__dirname, "rules"));
// Due to hyphens in the names, there are hyphens in the object keys.
// That makes it impossible to use the JavaScript destructuring operators, so we go old-school:
function ruleConfigs(mapVal, ruleNames) {
    switch (mapVal) {
        case "error":
        case "warn":
        case "off":
            break;
        default:
            throw new Error(
              `ruleConfigs 'mapVal' value not one of "error", "warn", "off": ${mapVal}`);
    }
    const newRuleObj = {};
    ruleNames.forEach(k => {
        if (!(k in allRules))
            throw new Error(`Bad rule name given to 'ruleConfigs' function: ${k}`);
        newRuleObj[`@admc.com/sn/${k}`] = mapVal;
    });
    return newRuleObj;
}

const clientRules = ruleConfigs("error", ["no-console-info"]);
const serverGlobalsCommon = globalsFromFiles("coreServerObjects", "SIScopes", "scopedNSs");
const clientGlobalsCommon =
  globalsFromFiles("client-commonForm", "client-commonList-only", "windowMembers");

const overrides = [
    {
        files: [  // Regular server-side
            "**/@(sa_pattern_prepost_script|sys_script_fix|sys_script|sys_script_include|sysauto_script|cert_audit|sys_ws_operation|sys_web_service|sys_processor|sys_ui_action.script|sysevent_script_action|sys_security_acl|sc_cat_item_producer|sys_script_email|sys_transform_map|sys_transform_script|sys_transform_entry|sp_widget.script|sys_ui_page.processing_script|sys_script.condition|sys_security_acl.condition|sysauto_script.condition|sys_ui_action.condition|sysevent_in_email_action|sys_atf_step_config.step_execution_generator|sys_atf_step_config.description_generator)/@(global|scoped-es5|scoped-es12)/*.js",
            "**/sys_ui_action.script/@(iso|noniso)_@(global|scoped-es5|scoped-es12)/*.js",
            "**/sys_ux_data_broker_transform/@(global|scoped-es5|scoped-es12)/*.js",
            "**/sys_variable_value/s*/*.js",  // s* for server-side
        ],
        rules: {
          ...ruleConfigs("error",
            ["no-sysid", "validate-gliderecord-calls", "no-gs-now", "no-cur-walk-to-sysid"]),
          ...ruleConfigs("warn", ["no-gr-count-iterate"]),
        }
    }, {  // BRs
        files: [ "**/sys_script/@(global|scoped-es5|scoped-es12)/*.js" ],
        rules: ruleConfigs("error", ["no-br-current-update"]),
    }, {  // Global scope
        // Bug here in that global scope w.r.t. APIs incl. gs.log are determined by specific
        // sys_scope record NOT by the sys_scope.scope scalar string value!
        // I think we need user work-around for these script types with non-global sys_scopes with
        // sys_scope.scope=="global".  In this case, eslint directive comments will need to be used
        // to defeat the sn_server_globals and rules here; and apply the sn_server_scoped globals
        // and rules.
        files: [
          "**/@(global|iso_global|noniso_global)/*.js",
          "**/sys_variable_value/s*_global/*.js",
        ],
        env: {"@admc.com/sn/sn_server_global": true },
        rules: {
            //"vars-on-top": "warn",  Would be excellent, but no good way to exclude consts
            ...ruleConfigs("error", ["log-global-2-args", "no-log-scoped"]),
        },
    }, {  // strictly server-side global discourage use console logging
        files: [ "**/global/*.js", "**/sys_variable_value/s*_global/*.js" ],
        rules: ruleConfigs("warn", ["no-log-console"]),
    }, {  // Scoped
        files: [
          "**/@(scoped-es5|scoped-es12|iso_scoped-es5|iso_scoped-es12|noniso_scoped-es5|noniso_scoped-es12)/*.js",
          "**/sys_variable_value/s*_scoped*/*.js",
        ],
        env: {"@admc.com/sn/sn_server_scoped": true },
        rules: ruleConfigs("error", ["no-log-global", "log-scoped-varargs"]),
    }, {  // MID
        files: ["**/@(ecc_agent_script|ecc_agent_script_include|sa_pattern)/all/*.js"],
        env: {"@admc.com/sn/sn_mid": true },
    }, { // Regular SN client scripts, both iso and non-iso
        files: [
            "**/@(sys_script_client|catalog_script_client|expert_script_client|sys_ui_action.script|sys_ui_policy.script_true|sys_ui_policy.script_false|catalog_ui_policy.script_true|catalog_ui_policy.script_false)/@(noniso|iso)/*.js",
            "**/@(sys_ui_script|sys_script_validator|sp_widget.client_script|sp_widget.link|sys_ui_page.client_script|sys_ui_action.client_script_v2|sys_ux_client_script|sys_ux_client_script_include|sys_ux_data_broker_scriptlet|sys_ui_context_menu)/all/*.js",
        ],
        // Looks like impliedStrict parser option is only useful if the runtime interpreter
        // really applies strict implicitly.
        // ServiceNow requires just 2 versions back for Edge and Chrome (both which release about
        // every month), so the limiting browser is Safari 12.0 which supports ES2018.
        // If you don't need to support Safari browser then override this value to match highest ES
        // version column with all acceptable values for your browsers at
        // https://kangax.github.io/compat-table/es2016plus/
        env: { es2018: true },
        rules: {
          "strict": ["warn", "function"],
          "prefer-exponentiation-operator": "error",
          "prefer-const": "error",
          "prefer-arrow-callback": "warn",
          "object-shorthand": "warn",
          "no-useless-rename": "warn",
          "no-var": "warn",
          "no-useless-constructor": "error",
          "prefer-template": "warn",
          "no-iterator": "error",
          "require-atomic-updates": "error",
          "no-unused-private-class-members": "error",
          "no-promise-executor-return": "error",
          "prefer-rest-params": "warn",
          "prefer-spread": "warn",
          ...clientRules,
          ...ruleConfigs("warn", ["no-sysid", "validate-gliderecord-calls", "no-client-gr"]),
          ...ruleConfigs("error", ["onchange-isloading-check"]),
        },
    }, { // ES12 server-side
        files: [ "**/scoped-es12/*.js", "**/sys_variable_value/s*_scoped-es12/*.js" ],
        // Looks like impliedStrict parser option is only useful if the runtime interpreter
        // really applies strict implicitly.  SN platform does not, of course.
        env: { es2022: true },
        rules: {
          "strict": ["warn", "global"],  // For non-IIFE scriptlet.  Overridden for IIFEs below.
          "prefer-exponentiation-operator": "error",
          "prefer-const": "error",
          "prefer-arrow-callback": "warn",
          "object-shorthand": "warn",
          "no-useless-rename": "warn",
          "no-var": "warn",
          "no-useless-constructor": "error",
          "prefer-template": "warn",
          "no-iterator": "error",
          "require-atomic-updates": "error",
          "no-unused-private-class-members": "error",
          "no-promise-executor-return": "error",
          "prefer-rest-params": "warn",
          "prefer-spread": "warn",
        },
    }, { // ES5+ IIFEs
        files: [
          "**/@(sys_script|sys_ws_operation|sys_web_service|sys_processor|sys_script_email|sys_transform_map|sys_transform_script|sp_widget.script|sys_ui_page.processing_script|sysevent_in_email_action|sys_atf_step_config.step_execution_generator)/scoped-es*/*.js",
          "**/sys_ui_action.script/@(iso|noniso)_scoped-es*/*.js",
          "**/sys_variable_value/sss_scoped-es*/*.js",
        ],
        // Since here all our code is inside the function, we can be less invasive and require
        // stricting just our additions:
        rules: { "strict": ["warn", "function"] }  // Overriding for ES5+ IIFE scriptlets
    }, {
        files: ["**/sys_ux_data_broker_transform/*/*.js"],
        rules: {
            "@admc.com/sn/single-fn": ["error", {
                table: "sys_ux_data_broker_transform",
            }],
            "@admc.com/sn/no-toplvl-arrow-fn": "error",
            strict: "off",  // See note about UIB/ux_* scriptlets at end of this overrides list.
        },
    }, {
        // Prohibit backtick ${x} subsitution and allow for sys_ui_message substitutions
        files:
          ["**/@(sys_ui_script|sp_widget.script|sp_widget.client_script|sp_widget.link|sys_ui_context_menu)/*/*.js"],
        rules: {
            "prefer-template": "off",
            "no-template-curly-in-string": "off",
            "@admc.com/sn/no-backtick-curlyref": "error",
        },
    }, {
        // Backtick ${x} doesn't work here
        files:
          ["**/sys_script_validator/*/*.js"],
        rules: {
            "prefer-template": "off",
            "@admc.com/sn/no-backtick-curlyref": "error",
        },
    }, {
        // Discourage backtick ${x} because that makes these incompatible with embedding in VA.
        files:
          ["**/catalog_script_client/*/*.js"],
        rules: {
            "prefer-template": "off",
            "@admc.com/sn/no-backtick-curlyref": "warn",
        },
    }, { // iso SN client scripts
        files: [
            "**/@(iso|iso_global|iso_scoped-es5|iso_scoped-es12)/*.js",
            "**/sys_ui_action.client_script_v2/all/*.js",
            "**/sys_ui_client_script/all/*.js",
            "**/sys_ux_client_script/all/*.js",
            "**/sys_ux_client_script_include/all/*.js",
            "**/sys_ux_data_broker_scriptlet/all/*.js",
        ],
        env: {"@admc.com/sn/sn_client_iso": true },
    }, { // Non-iso SN client scripts
        files: [
            "**/@(noniso|noniso_global|noniso_scoped-es5|noniso_scoped-es12)/*.js",
            "**/@(sys_ui_script|sys_script_validator|sp_widget.client_script|sp_widget.link|sys_ui_page.client_script|sys_ui_context_menu)/*/*.js",
        ],
        env: {"@admc.com/sn/sn_client_noniso": true, browser: true, },
    }, {
        files: ["**/sp_widget.client_script/*/*.js"],
        rules: ruleConfigs("error", ["controller-fn", "use-ang-inj-vars"]),
    }, {
        files: ["**/sp_widget.link/*/*.js"],
        rules: { "@admc.com/sn/use-ang-inj-vars": "error" },
    }, {
        files: ["**/sys_ui_action.script/@(iso|noniso)_@(global|scoped-es5|scoped-es12)/*.js"],
        rules: clientRules,
    }, { // All ui_actions EXCEPT client-only iso and noniso:
        files: ["**/sys_ui_action.script/@(global|scoped-es5|scoped-es12|iso_global|iso_scoped-es5|iso_scoped-es12|noniso_global|noniso_scoped-es5)/*.js",
          "**/sys_ui_action.condition/*/*.js"],
        globals: { action: "readonly", RP: "readonly" },
    }, {
        files: ["**/@(sys|catalog)_script_client/*/*.js"],
        rules: {
            "no-unused-vars": ["error", {
                args: "all",
                argsIgnorePattern: "^_?dummy",
                varsIgnorePattern: "^on(Load|Change|CellEdit|Submit)$|^_unused",
                caughtErrors: "all",
                caughtErrorsIgnorePattern: "^_?dummy",
            }],
        },
    }, {
        files: ["**/sys_ui_action.client_script_v2/all/*.js"],
        rules: {
            "no-unused-vars": ["error", {
                args: "all",
                argsIgnorePattern: "^_?dummy",
                varsIgnorePattern: "^onClick$|^_unused",
                caughtErrors: "all",
                caughtErrorsIgnorePattern: "^_?dummy",
            }],
        },
    }, {
        files: ["**/@(sys|catalog)_ui_policy.script_@(true|false)/*/*.js"],
        rules: {
            "no-unused-vars": ["error", {
                args: "all",
                argsIgnorePattern: "^_?dummy",
                varsIgnorePattern: "^onCondition$|^_unused",
                caughtErrors: "all",
                caughtErrorsIgnorePattern: "^_?dummy",
            }],
        },
    }, {
        files: ["**/sys_security_acl/*/*.js"],
        rules: {
            "no-unused-vars": ["error", {
                args: "all",
                argsIgnorePattern: "^_?dummy",
                varsIgnorePattern: "^answer$|^_unused",
                caughtErrors: "all",
                caughtErrorsIgnorePattern: "^_?dummy",
            }],
            "no-unused-expressions": "off",
        },
    }, {
        files: ["**/sys_transform_entry/*/*.js"],
        rules: {
            "no-unused-vars": ["error", {
                args: "all",
                argsIgnorePattern: "^_?dummy|^source$",
                varsIgnorePattern: "^answer$|^_unused",
                caughtErrors: "all",
                caughtErrorsIgnorePattern: "^_?dummy",
            }],
        },
    }, {
        files: ["**/sys_script_validator/*/*.js"],
        rules: {
            "no-unused-vars": ["error", {
                args: "all",
                argsIgnorePattern: "^_?dummy",
                varsIgnorePattern: "^validate$|^_unused",
                caughtErrors: "all",
                caughtErrorsIgnorePattern: "^_?dummy",
            }],
        },
    }, {
        files: ["**/@(sys_web_service|sys_ws_operation/*/*.js"],
        rules: {
            "no-unused-vars": ["error", {
                args: "all",
                argsIgnorePattern: "^_?dummy|^(request|response)$",
                varsIgnorePattern: "^_unused",
                caughtErrors: "all",
                caughtErrorsIgnorePattern: "^_?dummy",
            }],
        },
    }, {
        files: ["**/sys_script/*/*.js", "**/sys_script.condition/*/*.js"],
        rules: {
            "no-unused-vars": ["error", {
                args: "all",
                varsIgnorePattern: "^(g_scratchpad|action)$",
                argsIgnorePattern: "^_?dummy|^(current|previous)$|^_unused",
                caughtErrors: "all",
                caughtErrorsIgnorePattern: "^_?dummy",
            }],
        },
    }, {
        files: ["**/sys_processor/*/*.js"],
        rules: {
            "no-unused-vars": ["error", {
                args: "all",
                argsIgnorePattern: "^_?dummy|^g_(request|response_processor)$",
                varsIgnorePattern: "^_unused",
                caughtErrors: "all",
                caughtErrorsIgnorePattern: "^_?dummy",
            }],
        },
    }, {
        files: ["**/sys_script_email/*/*.js"],
        rules: {
            "no-unused-vars": ["error", {
                args: "all",
                argsIgnorePattern: "^_?dummy|^(current|template|email|email_action|event)$",
                varsIgnorePattern: "^_unused",
                caughtErrors: "all",
                caughtErrorsIgnorePattern: "^_?dummy",
            }],
        },
    }, {
        files: ["**/sys_transform_map/*/*.js"],
        rules: {
            "no-unused-vars": ["error", {
                args: "all",
                argsIgnorePattern: "^_?dummy|^(source|target|map|log|isUpdate)$",
                varsIgnorePattern: "^_unused",
                caughtErrors: "all",
                caughtErrorsIgnorePattern: "^_?dummy",
            }],
        },
    }, {
        files: ["**/sys_transform_script/*/*.js"],
        rules: {
            "no-unused-vars": ["error", {
                args: "all",
                argsIgnorePattern: "^_?dummy|^(source|map|log|target)$",
                varsIgnorePattern: "^_unused",
                caughtErrors: "all",
                caughtErrorsIgnorePattern: "^_?dummy",
            }],
        },
    }, {
        files: ["**/sp_widget.script/*/*.js"],
        rules: {
            "no-unused-vars": ["error", {
                args: "all",
                argsIgnorePattern: "^_?dummy|^(options|input|data|[$]sp)$",
                varsIgnorePattern: "^_unused",
                caughtErrors: "all",
                caughtErrorsIgnorePattern: "^_?dummy",
            }],
        },
    }, {
        // Defined functions may be invoked by Jelly code.
        // Seems that there's intention to replace core functions such as cancel().
        files: ["**/sys_ui_page.client_script/*/*.js"],
        rules: { "no-unused-vars": "off", "no-redeclare": "off" },
    }, {
        // Somehow these scripts get access to some user-defined variables
        files: ["**/sys_ui_page.processing_script/*/*.js"],
        rules: { "no-undef": "off" },
    }, {
        files: ["**/sa_pattern/*/*.js",
                "**/sys_atf_step_config.description_generator/*/*.js",
                "**/sys_variable_value/sin*/*.js"],
        rules: { "no-unused-expressions": "off" },
    }, {
        files: ["**/sys_variable_value/s*/*.js"],
        rules: { "@admc.com/sn/no-sysid": "off" },
    }, {
        files: ["**/*.condition/*/*.js"],
        rules: {
            strict: "off",  // don't want to bother developer for tiny scriptlets
            "no-unused-expressions": "off",
            semi: "off",
        },
    }, {
        files: ["**/sys_ux_client_script/all/*.js"],
        rules: {
            "@admc.com/sn/single-fn": ["error", { table: "sys_ux_client_script" }],
            strict: "off",  // See note about UIB/ux_* scriptlets at end of this overrides list.
        },
    }, {
        files: ["**/sys_ux_client_script_include/all/*.js"],
        rules: {
            "@admc.com/sn/single-fn": ["error", {
                table: "sys_ux_client_script_include",
                allowAdditionalParams: true,
            }],
            strict: "off",  // See note about UIB/ux_* scriptlets at end of this overrides list.
        },
    }, {
        files: ["**/sys_ux_data_broker_scriptlet/all/*.js"],
        rules: {
            "@admc.com/sn/single-fn": ["error", {
                table: "sys_ux_data_broker_scriptlet",
            }],
            "prefer-template": "off",
            "@admc.com/sn/no-toplvl-arrow-fn": "error",
            "@admc.com/sn/no-backticks": "error",
            strict: "off",
        },
    }
    /* UIB ux_* scriptlet "use strict" issue.
     *     If before function then system silently ignores the record;
     *     Function-level is incompatible with default/rest/restructuring
     *     params for traditional function def, which is what is required here. */
];

let entry, writables, readables, iifeParams, overridesEntry, overridesFiles,
  overridesRules, overridesGlobals;
const filesFinder = function(ent) { return ent.files.includes(String(this)); };
const addGlobal = function(newKey) { this.toMap[newKey] = String(this.access); };
for (const table in tableSpecificMap) {
    readables = writables = iifeParams = undefined;  // reset for this entry
    entry = tableSpecificMap[table];
    if (Array.isArray(entry)) {
        readables = entry;
    } else if (isPlainObject(entry)) {
        if ("readable" in entry) readables = entry.readable;
        if ("writable" in entry) writables = entry.writable;
        if ("iifeParams" in entry) {
            iifeParams = entry.iifeParams;
            if (readables)
                Array.prototype.push.apply(readables, iifeParams);
            else
                readables = iifeParams;
        }
    } else {
        throw new Error(`tableSpecificMap entry for ${table} is of unsupported type`);
    }
    if (readables === undefined && writables === undefined) {
        console.warn(`It appears that there is empty useless specificTables entry for ${table}`);
        continue;
    }

    //Validate all Array entries
    if (readables !== undefined) {
        if (!Array.isArray(readables))
            throw new Error(`tableSpecificMap entry for ${table} readables is not an array`);
        readables.forEach(ts => { if (typeof ts !== "string")
            throw new Error(`A tableSpecificMap ${table} readables entry not a string: ${ts}`);
        });
    }
    if (writables !== undefined) {
        if (!Array.isArray(writables))
            throw new Error(`tableSpecificMap entry for ${table} writables is not an array`);
        writables.forEach(ts => { if (typeof ts !== "string")
            throw new Error(`A tableSpecificMap ${table} writables entry not a string: ${ts}`);
        });
    }
    overridesFiles = `**/${table}/*/*.js`;
    overridesEntry = overrides.find(filesFinder, overridesFiles);
    if (!overridesEntry) {
        overridesEntry = { files: overridesFiles };
        overrides.push(overridesEntry);
    }
    if (iifeParams) {
        if ("rules" in overridesEntry) {
            overridesRules = overridesEntry.rules;
        } else {
            overridesRules = {};
            overridesEntry.rules = overridesRules;
        }
        overridesEntry.rules["@admc.com/sn/sn-workaround-iife"] = ["error", {
            table,
            paramCallVars: iifeParams,
        }];
    }
    if ("globals" in overridesEntry) {
        overridesGlobals = overridesEntry.globals;
    } else {
        overridesGlobals = {};
        overridesEntry.globals = overridesGlobals;
    }
    if (readables !== undefined)
        readables.forEach(addGlobal, {toMap: overridesGlobals, access: "readable"});
    if (writables !== undefined)
        writables.forEach(addGlobal, {toMap: overridesGlobals, access: "writable"});
}

/* The IIFE for sys_variable_values is sss-specific.
 * IIFEs added from the tableSpecifics file are only table-specific and are done AFTER the
 * main behavior table above, therefore need to override the sys_variable_value override later
 * here if alt !== sss*.
 * N.b. this removes the sn-workaround-iife rule but
 * purposefully leaves the readonly globals additions in place!
 */
overrides.push({
    files: ["**/sys_variable_value/i*/*.js", "**/sys_variable_value/sin*/*.js"],
    rules:  {"@admc.com/sn/sn-workaround-iife": "off"},
});

module.exports = {
    rules: allRules,
    environments: {
        sn_server_global: { globals: {
            SNC: false, ...serverGlobalsCommon, ...globalsFromFiles("globalSIs", "globalAPIs"),
        } },
        sn_server_scoped: { globals: {
            ...serverGlobalsCommon,
            ...globalsFromFiles("scopedSIs"), ...globalsFromFiles("scopedAPIs"),
        } },
        sn_mid: { globals: {
            Packages: false, ctx: false, CTX: false,
                      ...globalsFromFiles("midSIs", "coreMidObjects"),
        } },
        sn_client_iso: { globals: {
            URL: false,
            ...clientGlobalsCommon, ...globalsFromFiles("client-iso-only")
        } },
        sn_client_noniso: { globals: {
            ...clientGlobalsCommon, ...globalsFromFiles("client-noniso-only")
        } },
    },
    configs: {
        servicenow: {
            extends: ["eslint:recommended"],
            settings: {
                ootbTables: {
                  "catalog_script_client": ["iso", "noniso"],
                  "catalog_ui_policy.script_true": ["iso", "noniso"],
                  "catalog_ui_policy.script_false": ["iso", "noniso"],
                  "ecc_agent_script": ["all"],
                  "ecc_agent_script_include": ["all"],
                  "expert_script_client": ["iso", "noniso"],
                  "sa_pattern_prepost_script": ["global", "scoped-es5", "scoped-es12"],
                  "sc_cat_item_producer": ["global", "scoped-es5", "scoped-es12"],
                  "sp_widget.script": ["global", "scoped-es5", "scoped-es12"],
                  "sysauto_script": ["global", "scoped-es5", "scoped-es12"],
                  "cert_audit": ["global", "scoped-es5", "scoped-es12"],
                  "sysauto_script.condition": ["global", "scoped-es5", "scoped-es12"],
                  "sysevent_script_action": ["global", "scoped-es5", "scoped-es12"],
                  "sys_processor": ["global", "scoped-es5", "scoped-es12"],
                  "sys_script": ["global", "scoped-es5", "scoped-es12"],
                  "sys_script.condition": ["global", "scoped-es5", "scoped-es12"],
                  "sys_script_client": ["iso", "noniso"],
                  "sys_script_email": ["global", "scoped-es5", "scoped-es12"],
                  "sys_script_fix": ["global", "scoped-es5", "scoped-es12"],
                  "sysevent_in_email_action": ["global", "scoped-es5", "scoped-es12"],
                  "sys_atf_step_config.step_execution_generator":
                    ["global", "scoped-es5", "scoped-es12"],
                  "sys_atf_step_config.description_generator": ["global"],
                  "sys_script_include": ["global", "scoped-es5", "scoped-es12"],
                  "sys_script_validator": ["all"],
                  "sys_security_acl": ["global", "scoped-es5", "scoped-es12"],
                  "sys_security_acl.condition": ["global", "scoped-es5", "scoped-es12"],
                  "sys_transform_entry": ["global", "scoped-es5", "scoped-es12"],
                  "sys_transform_map": ["global", "scoped-es5", "scoped-es12"],
                  "sys_transform_script": ["global", "scoped-es5", "scoped-es12"],
                  "sys_web_service": ["global", "scoped-es5", "scoped-es12"],
                  "sys_ws_operation": ["global", "scoped-es5", "scoped-es12"],
                  "sys_ui_action.script": [
                    "global", "scoped-es5", "scoped-es12", "iso", "noniso", "iso_global",
                    "noniso_global", "iso_scoped-es5", "iso_scoped-es12",
                    "noniso_scoped-es5", "noniso_scoped-es12",
                  ],
                  "sys_ui_action.client_script_v2": ["all"],
                  "sys_ui_action.condition": ["global", "scoped-es5", "scoped-es12"],
                  "sys_ui_policy.script_true": ["iso", "noniso"],
                  "sys_ui_policy.script_false": ["iso", "noniso"],
                  "sys_ui_script": ["all"],
                  "sp_widget.client_script": ["all"],
                  "sp_widget.link": ["all"],
                  "sys_ui_context_menu": ["all"],
                  "sys_ui_page.client_script": ["all"],
                  "sys_ui_page.processing_script": ["global", "scoped-es5", "scoped-es12"],
                  "sa_pattern": ["all"],
                  "sys_ux_client_script": ["all"],
                  "sys_ux_client_script_include": ["all"],
                  "sys_ux_data_broker_transform": ["global", "scoped-es5", "scoped-es12"],
                  "sys_ux_data_broker_scriptlet": ["all"],
                  "sys_variable_value":
                    ["sss_global", "sss_scoped-es5", "sss_scoped-es12",
                     "sin_global", "sin_scoped-es5", "sin_scoped-es12"]
                }
            },
            rules: {
                "operator-assignment": "error",
                "no-useless-return": "error",
                "prefer-regex-literals": ["error", {disallowRedundantWrapping: true}],
                "no-useless-concat": "error",
                "no-useless-computed-key": "error",
                "no-useless-call": "error",
                "no-unused-expressions": "error",
                "no-undef-init": "error",
                "no-proto": "error",
                "no-new-wrappers": "error",
                "no-new-object": "error",
                "no-negated-condition": "error",
                "no-loop-func": "error",
                "no-lonely-if": "error",
                "no-lone-blocks": "error",
                "no-implied-eval": "warn",
                "no-eval": "warn",
                "no-extra-label": "error",
                "no-extra-bind": "error",
                "no-else-return": ["error", { allowElseIf: false }],
                "no-array-constructor": "warn",
                "new-cap": "error",
                "max-depth": "warn",
                "dot-notation": "warn",
                "consistent-return": "error",
                "class-methods-use-this": "error",
                "camelcase": ["warn", { properties: "never", ignoreGlobals: true }],
                "block-scoped-var": "error",
                "no-use-before-define": ["error", { functions: false, classes: false }],
                "no-unreachable-loop": "error",
                "no-template-curly-in-string": "warn",
                "no-self-compare": "error",
                "no-constructor-return": "error",
                "no-constant-binary-expression": "error",
                "array-callback-return": ["error", { checkForEach: true }],
                "eqeqeq": "warn",
                "no-eq-null": "warn",
                "semi": "warn",
                //"no-extra-parens": "warn",  In practice, too stringent
                "no-mixed-spaces-and-tabs": "off",
                "no-unused-vars": ["error", {
                  args: "all",
                  argsIgnorePattern: "^_?dummy",
                  varsIgnorePattern: "^_unused",
                  caughtErrors: "all",
                  caughtErrorsIgnorePattern: "^_?dummy",
                 }],

                ...ruleConfigs("error", [
                    "invalid-table-alt",
                    "immediate-iife",
                    "no-boilerplate",
                    "no-useless-rtrn",
                    "legacy-use-this",
                ]),
                ...ruleConfigs("warn", ["prefer-array-iterator", "no-init-emptystring"]),
            },

            overrides
        }
    }
};
