"use strict";
const path = require("path");
const fs = require("fs");
const globalsDir = require("./lib/resolveGlobalsDir");
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
    tableSpecificMap = JSON.parse(fs.readFileSync(fp, "utf8").replace(/\r/g, "").
          replace(/^[ \t]*[/][*][\S\s]*?[*][/]/mg, "").
          replace(/^[ \t]*[/][/][^\n]*\n/mg, "").replace(/^[ \t]*\n/mg, ""));
} catch (parseE) {
    throw new Error(`Failed to parse JSON from '${fp}': ${parseE.message}`);
}
fp = path.join(globalsDir, "tableSpecifics-local.json");
if (fs.existsSync(fp)) try {
    tableSpecificMap =
      {...tableSpecificMap, ...JSON.parse(fs.readFileSync(fp, "utf8"))};
} catch (parseE) {
    throw new Error(`Failed to parse JSON from '${fp}': ${parseE.message}`);
}
const tableSpecificEntries = table => {
    if (!(table in tableSpecificMap)) return null;
        //throw new Error(`'tableSpecifics.json' file has no entry for '${table}'`);
    let k;
    const overrideEntries = {};
    const testAndAddGlobals = function(newKey) {
        if (typeof newKey !== "string") throw new Error(
            `Non-string value '${newKey}' for table '${table}' in 'tableSpecifics*.json'`);
        if (overrideEntries.globals === undefined) overrideEntries.globals = {};
        overrideEntries.globals[newKey] = String(this);
    };
    const testAndAddRule = function(pList) {
        if (!Array.isArray(pList)) throw new Error(
            `Non-Array value '${pList}' for table '${table}' in 'tableSpecifics*.json'`);
        if (overrideEntries.rules === undefined) overrideEntries.rules = {};
        overrideEntries.rules["@admc.com/sn/sn-workaround-iife"] = ["error", {
            table,
            paramCallVars: pList,
        }];
    };

    if (Array.isArray(tableSpecificMap[table])) {
        overrideEntries.globals = {};
        tableSpecificMap[table].forEach(g => {
            if (typeof g !== "string") new Error(
                `Non-string value '${g}' for table '${table}' list in 'tableSpecifics*.json'`);
            overrideEntries.globals[g] = "readonly";
        });
    } else if (typeof tableSpecificMap[table] === "object") {
        for (k in tableSpecificMap[table]) switch (k) {
            case "iifeParams":
                testAndAddRule(tableSpecificMap[table].iifeParams);
            case "readonly":  // eslint-disable-line no-fallthrough
            case "writable":
                tableSpecificMap[table][k].forEach(testAndAddGlobals,
                  k === "iifeParams" ? "readonly" : k);
                break;
            default:
                new Error(
                  `Unexpected key value ${k} for table '${table}' in 'tableSpecifics*.json'`);
        }
    }
    return overrideEntries;
};


const allRules = require("requireindex")(path.join(__dirname, "rules"));
// Due to hyphens in the names, there are hyphens in the object keys.
// That makes it impossible to use the JavaScript destructuring operators, so we go old-school:
function ruleConfigs(mapVals, ruleNames) {
    switch (mapVals) {
        case "error":
        case "warn":
        case "off":
            break;
        default:
            throw new Error(
              `ruleConfigs 'mapVals' value not one of "error", "warn", "off": ${mapVals}`);
    }
    const newRuleObj = {};
    ruleNames.forEach(k => {
        if (!(k in allRules))
            throw new Error(`Bad rule name given to 'ruleConfigs' function: ${k}`);
        newRuleObj[`@admc.com/sn/${k}`] = mapVals;
    });
    return newRuleObj;
}

const clientRules = ruleConfigs("error", ["no-console-info"]);
const serverConstsCommon = globalsFromFiles("coreServerObjects", "SIScopes");
const clientConstsCommon =
  globalsFromFiles("client-commonForm", "client-commonList-only", "windowMembers");

const overrides = [
    // Overrides entries with only a 'files' member are present only to trigger automatic additions
    // according to tableSpecifics*.json file(s).
    {
        files: [
            "**/@(sa_pattern_prepost_script|sys_script_fix|sys_script|sys_script_include|sysauto_script|sys_ws_operation|sys_web_service|sys_processor|sys_ui_action|sysevent_script_action|sys_security_acl|sc_cat_item_producer|sys_script_email|sys_script_validator|sys_transform_map|sys_transform_script|sys_transform_entry|sys_script_validator)/@(global|scoped)/*.js",  // eslint-disable-line max-len
            "**/sys_ui_action/@(iso|noniso)_@(global|scoped)action/*.js",
        ],
        rules: {
          ...ruleConfigs("off", ["invalid-table-altscope"]),
          ...ruleConfigs("error", ["no-sysid", "validate-gliderecord-calls"]),
        },
    }, {
        files: [ "**/@(global|iso_globalaction|noniso_globalaction)/*.js" ],
        env: {"@admc.com/sn/sn_server_global": true },
        rules: {
          ...ruleConfigs("error", ["log-global-2-args", "no-log-scoped"])
        },
    }, {
        files: [ "**/@(scoped|iso_scopedaction|noniso_scopedaction)/*.js" ],
        env: {"@admc.com/sn/sn_server_scoped": true },
        rules: {
          ...ruleConfigs("error", ["no-log-global"])
        },
    }, {
        files: ["**/ecc_agent_script@(|_include)/*.js"],
        env: {"@admc.com/sn/sn_mid": true },
        rules: { ...ruleConfigs("off", ["invalid-table-altscope"]), },
    }, {
        files: [
            "**/@(sys_script_client|catalog_script_client|expert_script_client|sys_ui_action|sys_ui_policy.script_true|sys_ui_policy.script_false)/@(noniso|iso)/*.js",  // eslint-disable-line max-len
            "**/sys_ui_script/*.js",
        ],
        parserOptions: { ecmaVersion: 6 },
        rules: {
          ...ruleConfigs("off", ["invalid-table-altscope"]),
          "strict": ["warn", "safe"],
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
        },
    }, {
        files: ["**/sys_ui_script/*.js"],
        rules: { "prefer-template": "off", },
    }, {
        files: ["**/sys_script/*/*.js"],
    }, {
        files: ["**/sys_script_validator/*/*.js"],
    }, {
        files: ["**/sys_processor/*/*.js"],
    }, {
        files: ["**/sys_script_email/*/*.js"],
    }, {
        files: ["**/sys_transform_map/*/*.js"],
    }, {
        files: ["**/sys_transform_script/*/*.js"],
    }, {
        files: ["**/sys_transform_entry/*/*.js"],
    }, {
        files: ["**/sys_security_acl/*/*.js"],
    }, {
        files: ["**/sc_cat_item_producer/*/*.js"],
    }, {
        files: ["**/sysevent_script_action/*/*.js"],
    }, {
        files: ["**/sa_pattern_prepost_script/*/*.js"],
    }, {
        files: ["**/sys_ws_operation/*/*.js"],
    }, {
        files: ["**/sys_web_service/*/*.js"],
    }, {
        files: [ "**/@(iso|iso_globalaction|iso_scopedaction)/*.js" ],
        env: {"@admc.com/sn/sn_client_iso": true },
    }, {
        files: [
            "**/@(noniso|noniso_globalaction|noniso_scopedaction)/*.js",
            "**/sys_ui_script/*.js",
        ],
        env: {"@admc.com/sn/sn_client_noniso": true, browser: true, },
    }, {
        files: ["**/sys_ui_action/@(iso|noniso)_@(global|scoped)action/*.js"],
        rules: clientRules,
    }, {
        // All ui_actions EXCEPT client only iso and noniso:
        files: ["**/sys_ui_action/@(global|scoped|iso_globalaction|iso_scopedaction|noniso_globalaction|noniso_scopedaction)/*.js"],  // eslint-disable-line max-len
        globals: { action: false },
    }, {
        files: ["**/@(sys|catalog)_script_client/*/*.js"],
        rules: {
            "no-unused-vars": ["error", {
                varsIgnorePattern: "^on(Load|Change|CellEdit|Submit)$",
            }],
        },
    }, {
        files: ["**/sys_ui_policy.script_@(true|false)/*/*.js"],
        rules: { "no-unused-vars": ["error", { varsIgnorePattern: "^onCondition$", }] },
    }, {
        files: ["**/sys_@(security_acl|transform_entry)/*/*.js"],
        rules: { "no-unused-vars": ["error", { varsIgnorePattern: "^answer$", }] },
    },
];

overrides.filter(oRide => oRide.files.length === 1 && !oRide.files[0].includes("@")).
  forEach(oRide => {
      const ex = /\w+/.exec(oRide.files[0]);
      if (!ex) return;
      const entries = tableSpecificEntries(ex[0]);
      if (entries === null) return;
      if (entries.globals) oRide.globals = entries.globals;
      if (entries.globals) oRide.rules = entries.rules;
  });

module.exports = {
    rules: allRules,
    environments: {
        sn_server_global: { globals: {
            SNC: false, ...serverConstsCommon, ...globalsFromFiles("globalSIs", "globalAPIs"),
        } },
        sn_server_scoped: { globals: {
            ...serverConstsCommon,
            ...globalsFromFiles("scopedSIs"), ...globalsFromFiles("scopedAPIs"),
        } },
        sn_mid: { globals: {
            Packages: false, ctx: false, CTX: false, ...globalsFromFiles("midSIs"),
        } },
        sn_client_iso: { globals: {
            URL: false,
            ...clientConstsCommon, ...globalsFromFiles("client-iso-only")
        } },
        sn_client_noniso: { globals: {
            ...clientConstsCommon, ...globalsFromFiles("client-noniso-only")
        } },
    },
    configs: {
        servicenow: {
            extends: ["eslint:recommended"],
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

                // 'invalid-table-altscope' purposefully fails tests that aren't for a
                // supported override subset:
                 ...ruleConfigs("error",
                   ["invalid-table-altscope", "immediate-iife", "log-scoped-varargs"]),
                 ...ruleConfigs("warn", ["prefer-array-iterator", "no-init-emptystring"]),
            },

            overrides
        }
    }
};
