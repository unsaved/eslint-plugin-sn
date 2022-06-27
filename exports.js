const path = require("path");
const fs = require("fs");
const globalsDir = require("./lib/resolveGlobalsDir");
console.debug(`Using globalsDir '${globalsDir}'`);

/**
 * Output are just the 'gName: true' entries,not the "globals" keyword for the plain object
 */
function globalsFromFiles() {
    const fName = "globalsFromFiles";
    const params = Array.prototype.slice.call(arguments);
    const pObj = {};
    params.forEach(baseName => {
        const fp = path.join(globalsDir, baseName + ".txt");
        if (!fs.existsSync(fp))
            throw new Error(`${fName} does not find file '${fp}'`);
        let i = 0;
        fs.readFileSync(fp, "utf8").replace(/\r/g, "").split("\n").forEach(line => {
            i++;
            const s = line.trim();
            if (s === "" || s[0] === "#" || s.startsWith("//")) return;
            if (/\s/.test(line))
                throw new Error(`${fName} gets malformatted line '${fp}':${i}`);
            pObj[s] = true;
        });
    });
    return pObj;
}

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
        newRuleObj["@admc.com/sn/" + k] = mapVals;
    });
    return newRuleObj;
}

const serverRules = ruleConfigs("warn", ["require-iife"]);
const clientRules = ruleConfigs("error", ["no-console-info"]);
const serverConstsCommon = globalsFromFiles("coreServerObjects", "ootbSIScopes");
const clientConstsCommon = globalsFromFiles("client-common");

module.exports = {
    rules: allRules,
    parserOptions: { ecmaFeatures: { impliedStrict: true } },
    environments: {
        /* eslint-disable camelcase */
        sn_server_global: { globals: {
            ...serverConstsCommon, ...globalsFromFiles("ootbGlobalSIs", "globalAPIs"),
        } },
        sn_server_scoped: { globals: serverConstsCommon },
        sn_mid: { globals: globalsFromFiles("ootbMidSIs") },
        sn_client_iso: { globals: {
            ...clientConstsCommon, ...globalsFromFiles("client-iso-only")
        } },
        sn_client_noniso: { globals: {
            ...clientConstsCommon, ...globalsFromFiles("client-noniso-only")
        } },
        /* eslint-enable camelcase */
    },
    configs: {
        servicenow: {
            extends: ["eslint:recommended"],
            rules: { "@admc.com/sn/invalid-table-altscope": "error" },

            overrides: [
                {
                    files: ["**/sys_@(script_fix|script|script_include|auto_script)/global/*.js"],
                    env: {"@admc.com/sn/sn_server_global": true },
                    rules: {
                      "@admc.com/sn/invalid-table-altscope": "off",
                      ...serverRules,
                      ...ruleConfigs("error", ["log-global-2-args"]),
                    },
                },
                {
                    files: ["**/sys_@(script_fix|script|script_include|auto_script)/scoped/*.js"],
                    env: {"@admc.com/sn/sn_server_scoped": true },
                    rules: {
                      "@admc.com/sn/invalid-table-altscope": "off",
                      ...serverRules,
                      ...ruleConfigs("warn", ["no-log-global"])
                    },
                },
                {
                    files: ["**/ecc_agent_script_include/*.js"],
                    env: {"@admc.com/sn/sn_mid": true },
                    rules: { ...ruleConfigs("error", ["log-global-2-args"]), },
                },
                {
                    // I'm not sure about expert_script_client.  Never used them.
                    files: ["**/@(sys|catalog|expert)_script_client/iso/*.js"],
                    env: {"@admc.com/sn/sn_client_iso": true },
                    parserOptions: { ecmaVersion: 6 },
                    rules: {
                      "@admc.com/sn/invalid-table-altscope": "off",
                      ...clientRules,
                    },
                },
                {
                    // I'm not sure about expert_script_client.  Never used them.
                    files: ["**/@(sys|catalog|expert)_script_client/noniso/*.js"],
                    env: {"@admc.com/sn/sn_client_noniso": true, browser: true, },
                    parserOptions: { ecmaVersion: 6 },
                    rules: {
                      "@admc.com/sn/invalid-table-altscope": "off",
                      ...clientRules,
                    },
                },
            ]
        }
    }
};
