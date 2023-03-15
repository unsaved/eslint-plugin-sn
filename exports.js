"use strict";
const { isPlainObject } = require("@admc.com/apputil");
const path = require("path");
const fs = require("fs");
const globalsDir = require("./lib/resolveGlobalsDir");
const jsonEasyStrip = require("json-easy-strip");
if (process.env.DEBUG) console.debug(`Using globalsDir '${globalsDir}'`);

/**
 * Output are just the 'gName: true' entries,not the "globals" keyword for the plain object
 */
function globalsFromFiles() {
    const fName = "globalsFromFiles";
    const params = Array.prototype.slice.call(arguments);
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
        files: [
            "**/@(sa_pattern_prepost_script|sys_script_fix|sys_script|sys_script_include|sysauto_script|sys_ws_operation|sys_web_service|sys_processor|sys_ui_action.script|sysevent_script_action|sys_security_acl|sc_cat_item_producer|sys_script_email|sys_transform_map|sys_transform_script|sys_transform_entry|sp_widget.script|sys_ui_page.processing_script|sys_script.condition|sys_security_acl.condition|sysauto_script.condition|sys_ui_action.condition)/@(global|scoped-es5|scoped-es12)/*.js",  // eslint-disable-line max-len
            "**/sys_ui_action.script/@(iso|noniso)_@(global|scoped-es5|scoped-es12)/*.js",
            "**/sys_ux_data_broker_transform/@(global|scoped-es5|scoped-es12)/*.js",
        ],
        rules: ruleConfigs("error", ["no-sysid", "validate-gliderecord-calls", "no-gs-now"]),
    }, {
        files: [ "**/sys_script/@(global|scoped-es5|scoped-es12)/*.js" ],
        rules: ruleConfigs("error", ["no-br-current-update"]),
    }, {
        files: [ "**/@(global|iso_global|noniso_global)/*.js" ],
        env: {"@admc.com/sn/sn_server_global": true },
        rules: ruleConfigs("error", ["log-global-2-args", "no-log-scoped"]),
    }, {
        files: [ "**/@(scoped-es5|scoped-es12|iso_scoped-es5|iso_scoped-es12|noniso_scoped-es5|noniso_scoped-es12)/*.js" ],  // eslint-disable-line max-len
        env: {"@admc.com/sn/sn_server_scoped": true },
        rules: ruleConfigs("error", ["no-log-global", "log-scoped-varargs"]),
    }, {
        files: ["**/@(ecc_agent_script|ecc_agent_script_include|sa_pattern)/all/*.js"],
        env: {"@admc.com/sn/sn_mid": true },
    }, {
        // Regular SN client scripts, both iso and non-iso
        files: [
            "**/@(sys_script_client|catalog_script_client|expert_script_client|sys_ui_action.script|sys_ui_policy.script_true|sys_ui_policy.script_false|catalog_ui_policy.script_true|catalog_ui_policy.script_false)/@(noniso|iso)/*.js",  // eslint-disable-line max-len
            "**/@(sys_ui_script|sys_script_validator|sp_widget.client_script|sys_ui_page.client_script|sys_ui_action.client_script_v2|sys_ux_client_script|sys_ux_client_script_include|sys_ux_data_broker_scriptlet)/all/*.js",  // eslint-disable-line max-len,
        ],
        // Looks like impliedStrict parser option is only useful if the runtime interpreter
        // really applies strict implicitly.
        // ServiceNow requires just 2 versions back for Edge and Chrome, so the limiting browser
        // is Safari 12.0 which is supports ES2018.
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
          ...clientRules,
          ...ruleConfigs("warn", ["no-sysid", "validate-gliderecord-calls", "no-client-gr"]),
        },
    }, {
        // ES12 server-side
        files: [ "**/scoped-es12/*.js" ],
        // Looks like impliedStrict parser option is only useful if the runtime interpreter
        // really applies strict implicitly.
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
        },
    }, {
        // ES12 IIFEs
        files: [
          "**/@(sys_script|sys_ws_operation|sys_web_service|sys_processor|sys_script_email|sys_transform_map|sys_transform_script|sp_widget.script|sys_ui_page.processing_script)/scoped-es12/*.js",  // eslint-disable-line max-len
          "**/sys_ui_action.script/@(iso|noniso)_scoped-es12/*.js",
        ],
        rules: { "strict": ["warn", "function"] }  // Overriding for ES12 IIFE scriptlets
    }, {
        files: ["**/sys_ux_data_broker_transform/*/*.js"],
        rules: {
            "@admc.com/sn/single-fn-obj-param": ["error", {
                table: "sys_ux_data_broker_transform",
                allowAdditionalParams: true,
            }],
            "@admc.com/sn/no-arrow-fn": "error",
            strict: "off",
        },
    }, {
        files: ["**/sys_ui_script/*/*.js"],
        rules: { "prefer-template": "off", ...ruleConfigs("warn", ["no-uiscript-curlyref"]) },
    }, {
        // iso SN client scripts
        files: [
            "**/@(iso|iso_global|iso_scoped-es5|iso_scoped-es12)/*.js",
            "**/sys_ui_action.client_script_v2/all/*.js",
            "**/sys_ui_client_script/all/*.js",
            "**/sys_ux_client_script/all/*.js",
            "**/sys_ux_client_script_include/all/*.js",
            "**/sys_ux_data_broker_scriptlet/all/*.js",
        ],
        env: {"@admc.com/sn/sn_client_iso": true },
    }, {
        // Non-iso SN client scripts
        files: [
            "**/@(noniso|noniso_global|noniso_scoped-es5|noniso_scoped-es12)/*.js",
            "**/@(sys_ui_script|sys_script_validator|sp_widget.client_script|sys_ui_page.client_script)/*/*.js",  // eslint-disable-line max-len,
        ],
        env: {"@admc.com/sn/sn_client_noniso": true, browser: true, },
    }, {
        files: ["**/sys_ui_action.script/@(iso|noniso)_@(global|scoped-es5|scoped-es12)/*.js"],
        rules: clientRules,
    }, {
        // All ui_actions EXCEPT client-only iso and noniso:
        files: ["**/sys_ui_action.script/@(global|scoped-es5|scoped-es12|iso_global|iso_scoped-es5|iso_scoped-es12|noniso_global|noniso_scoped-es5)/*.js",  // eslint-disable-line max-len
          "**/sys_ui_action.condition/*/*.js"],
        globals: { action: "readonly", RP: "readonly" },
    }, {
        files: ["**/@(sys|catalog)_script_client/*/*.js"],
        rules: {
            "no-unused-vars": ["error", {
                varsIgnorePattern: "^on(Load|Change|CellEdit|Submit)$",
            }],
        },
    }, {
        files: ["**/sys_ui_action.client_script_v2/all/*.js"],
        rules: { "no-unused-vars": ["error", { varsIgnorePattern: "^onClick$", }], },
    }, {
        files: ["**/@(sys|catalog)_ui_policy.script_@(true|false)/*/*.js"],
        rules: { "no-unused-vars": ["error", { varsIgnorePattern: "^onCondition$", }] },
    }, {
        files: ["**/sys_security_acl/*/*.js"],
        rules: { "no-unused-vars": ["error", { varsIgnorePattern: "^answer$", }] },
    }, {
        files: ["**/sys_transform_entry/*/*.js"],
        rules: { "no-unused-vars": ["error", {
            varsIgnorePattern: "^answer$",
            argsIgnorePattern: "^source$",
        }] },
    }, {
        files: ["**/sys_script_validator/*/*.js"],
        rules: { "no-unused-vars": ["error", { varsIgnorePattern: "^validate$", }] },
    }, {
        files: ["**/@(sys_web_service|sys_ws_operation/*/*.js"],
        rules: { "no-unused-vars": ["error", { argsIgnorePattern: "^(request|response)$", }] },
    }, {
        files: ["**/sys_script/*/*.js", "**/sys_script.condition/*/*.js"],
        rules: { "no-unused-vars": ["error", {
            varsIgnorePattern: "^(g_scratchpad|action)$",
            argsIgnorePattern: "^(current|previous)$",
        }] },
    }, {
        files: ["**/sys_processor/*/*.js"],
        rules: { "no-unused-vars":
                 ["error", { argsIgnorePattern: "^g_(request|response_processor)$", }] },
    }, {
        files: ["**/sys_script_email/*/*.js"],
        rules: { "no-unused-vars":
               ["error", { argsIgnorePattern: "^(current|template|email|email_action|event)$", }] },
    }, {
        files: ["**/sys_transform_map/*/*.js"],
        rules: { "no-unused-vars":
               ["error", { argsIgnorePattern: "^(source|target|map|log|isUpdate)$", }] },
    }, {
        files: ["**/sys_transform_script/*/*.js"],
        rules: { "no-unused-vars": ["error", { argsIgnorePattern: "^(source|map|log|target)$", }] },
    }, {
        files: ["**/sp_widget.script/*/*.js"],
        rules: { "no-unused-vars":
               ["error", { argsIgnorePattern: "^(options|input|data|[$]sp)$", }] },
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
        files: ["**/sa_pattern/*/*.js"],
        rules: { "no-unused-expressions": "off" },
    }, {
        files: ["**/*.condition/*/*.js"],
        rules: {
            strict: "off",
            "no-unused-expressions": "off",
            semi: "off",
        },
    }, {
        files: ["**/sys_ux_client_script/all/*.js"],
        rules: {
            "@admc.com/sn/single-fn-obj-param": ["error", { table: "sys_ux_client_script" }],
            strict: "off",
        },
    }, {
        files: ["**/sys_ux_client_script_include/all/*.js"],
        rules: {
            "@admc.com/sn/single-fn-obj-param": ["error", {
                table: "sys_ux_client_script_include",
                allowAdditionalParams: true,
            }],
            strict: "off",
        },
    }, {
        files: ["**/sys_ux_data_broker_scriptlet/all/*.js"],
        rules: {
            "@admc.com/sn/single-fn-obj-param": ["error", {
                table: "sys_ux_data_broker_scriptlet",
                allowAdditionalParams: true,
            }],
            "@admc.com/sn/no-arrow-fn": "error",
            "@admc.com/sn/no-backticks": "error",
            strict: "off",
        },
    }
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
                  "sysauto_script.condition": ["global", "scoped-es5", "scoped-es12"],
                  "sysevent_script_action": ["global", "scoped-es5", "scoped-es12"],
                  "sys_processor": ["global", "scoped-es5", "scoped-es12"],
                  "sys_script": ["global", "scoped-es5", "scoped-es12"],
                  "sys_script.condition": ["global", "scoped-es5", "scoped-es12"],
                  "sys_script_client": ["iso", "noniso"],
                  "sys_script_email": ["global", "scoped-es5", "scoped-es12"],
                  "sys_script_fix": ["global", "scoped-es5", "scoped-es12"],
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
                  "sys_ui_page.client_script": ["all"],
                  "sys_ui_page.processing_script": ["global", "scoped-es5", "scoped-es12"],
                  "sa_pattern": ["all"],
                  "sys_ux_client_script": ["all"],
                  "sys_ux_client_script_include": ["all"],
                  "sys_ux_data_broker_transform": ["global", "scoped-es5", "scoped-es12"],
                  "sys_ux_data_broker_scriptlet": ["all"],
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
                "no-else-return": "error",
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
                "semi": "warn",
                //"no-extra-parens": "warn",  In practice, too stringent
                "no-mixed-spaces-and-tabs": "off",

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
