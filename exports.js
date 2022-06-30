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

const fp = path.join(globalsDir, "tableSpecifics.json");
if (!fs.existsSync(fp))
    throw new Error(`SN Plugin does not find file 'tableSpecifics.json'`);
const tableSpecificGlobals = JSON.parse(fs.readFileSync(fp, "utf8"));


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

const serverRules = ruleConfigs("warn", ["require-iife"]);
const clientRules = ruleConfigs("error", ["no-console-info"]);
const serverConstsCommon = globalsFromFiles("coreServerObjects", "SIScopes");
const clientConstsCommon = globalsFromFiles("client-common");

module.exports = {
    rules: allRules,
    environments: {
        /* eslint-disable camelcase */
        sn_server_global: { globals: {
            SNC: false, ...serverConstsCommon, ...globalsFromFiles("globalSIs", "globalAPIs"),
        } },
        sn_server_scoped: { globals: {
            ...serverConstsCommon, ...globalsFromFiles("scopedSIs"),
        } },
        sn_mid: { globals: {
            Packages: false, ctx: false, CTX: false, ...globalsFromFiles("midSIs"),
        } },
        sn_client_iso: { globals: {
            URL: false,
            ...clientConstsCommon, ...globalsFromFiles("client-iso-only", "windowMembers")
        } },
        sn_client_noniso: { globals: {
            ...clientConstsCommon, ...globalsFromFiles("client-noniso-only")
        } },
        /* eslint-enable camelcase */
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
                "camelcase": "warn",
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
                "no-extra-parens": "warn",

                "@admc.com/sn/invalid-table-altscope": "error",
            },

            overrides: [
                {
                    files: ["**/@(sa_pattern_prepost_script|sys_script_fix|sys_script|sys_script_include|sys_auto_script)/@(global|scoped)/*.js"],  // eslint-disable-line max-len
                    rules: {
                      "@admc.com/sn/invalid-table-altscope": "off",
                      ...serverRules,
                    },
                },
                {
                    files: ["**/@(sa_pattern_prepost_script|sys_script_fix|sys_script|sys_script_include|sys_auto_script)/global/*.js"],  // eslint-disable-line max-len
                    env: {"@admc.com/sn/sn_server_global": true },
                    rules: {
                      ...ruleConfigs("error", ["log-global-2-args", "no-log-scoped"])
                    },
                },
                {
                    files: ["**/@(sa_pattern_prepost_script|sys_script_fix|sys_script|sys_script_include|sys_auto_script)/scoped/*.js"],  // eslint-disable-line max-len
                    env: {"@admc.com/sn/sn_server_scoped": true },
                    rules: {
                      ...ruleConfigs("error", ["no-log-global"])
                    },
                },
                {
                    files: ["**/ecc_agent_script@(|_include)/*.js"],
                    env: {"@admc.com/sn/sn_mid": true },
                    rules: {
                      "@admc.com/sn/invalid-table-altscope": "off",
                    },
                },
                {
                    // I'm not sure about expert_script_client.  Never used them.
                    files: ["**/@(sys|catalog|expert)_script_client/@(noniso|iso)/*.js"],
                    parserOptions: { ecmaVersion: 6 },
                    rules: {
                      "@admc.com/sn/invalid-table-altscope": "off",
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
                },
                {
                    files: ["**/@(sys|catalog|expert)_script_client/iso/*.js"],
                    env: {"@admc.com/sn/sn_client_iso": true },
                },
                {
                    files: ["**/@(sys|catalog|expert)_script_client/noniso/*.js"],
                    env: {"@admc.com/sn/sn_client_noniso": true, browser: true, },
                },
                {
                    files: ["**/sa_pattern_prepost_script/*/*.js"],
                    rules: {
                        "no-unused-vars": ["error", {
                            varsIgnorePattern: tableSpecificGlobals.sa_pattern_prepost_script
                        }],
                    },
                },
                {
                    files: ["**/sys_script_client/*/*.js"],
                    rules: {
                        "no-unused-vars": ["error", {
                            varsIgnorePattern: tableSpecificGlobals.sys_script_client
                        }],
                    },
                },
            ]
        }
    }
};
