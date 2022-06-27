const path = require("path");
const fs = require("fs");

const globalsFromFile = file => {
    const fp = path.join("globals", file + ".txt");
    if (!fs.existsSync(fp))
        throw new Error(`globalsFromFile does not find file '${fp}'`);
    const pObj = {};
    let i = 0;
    fs.readFileSync(fp, "utf8").replace(/\r/g, "").split("\n").forEach(line => {
        i++;
        const s = line.trim();
        if (s === "") return;
        if (s[0] === "#") return;
        if (s.startsWith("//")) return;
        if (/\s/.test(line)) throw new Error(`globalsFromFile gets malformatted line '${fp}':${i}`);
        pObj[s] = true;
    });
    return pObj;
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
        newRuleObj["@admc.com/sn/" + k] = mapVals;
    });
    return newRuleObj;
}

const serverRules = ruleConfigs("warn", ["require-iife"]);
const clientRules = ruleConfigs("error", ["no-console-info"]);
const serverConsts = globalsFromFile("server");
const clientConsts = globalsFromFile("client");

module.exports = {
    rules: allRules,
    parserOptions: { ecmaFeatures: { impliedStrict: true } },
    environments: {
        /* eslint-disable camelcase */
        sn_server: { serverConsts },
        sn_mid: { globals: globalsFromFile("mid") },
        sn_client: { globals: clientConsts },
        sn_server_scoped: { globals: globalsFromFile("serverScopedOnly") },
        sn_client_noiso: {
          globals: { ...globalsFromFile("clientNonIsolatedOnly"), ...clientConsts } },
        /* eslint-enable camelcase */
    },
    configs: {
        servicenow: {
            extends: ["eslint:recommended"],
            rules: { "@admc.com/sn/invalid-table-altscope": "error" },

            overrides: [
                {
                    files: ["**/@(sys_script_fix|sys_script|sys_script_include)/global/*.js"],
                    env: {"@admc.com/sn/sn_server": true },
                    rules: {
                      "@admc.com/sn/invalid-table-altscope": "off",
                      ...serverRules,
                      ...ruleConfigs("error", ["log-global-2-args"]),
                    },
                },
                {
                    files: ["**/ecc_agent_script_include/*.js"],
                    env: {"@admc.com/sn/sn_mid": true },
                    rules: { ...ruleConfigs("error", ["log-global-2-args"]), },
                },
                {
                    files: ["**/@(sys_script_fix|sys_script|sys_script_include)/scoped/*.js"],
                    env: {"@admc.com/sn/sn_server_scoped": true },
                    rules: {
                      "@admc.com/sn/invalid-table-altscope": "off",
                      ...serverRules,
                      ...ruleConfigs("warn", ["no-log-global"])
                    },
                },
                {
                    files: ["**/@(sys_script_client)/iso/*.js"],
                    env: {"@admc.com/sn/sn_client": true },
                    rules: {
                      "@admc.com/sn/invalid-table-altscope": "off",
                      ...clientRules,
                    },
                },
                {
                    files: ["**/@(sys_script_client)/noiso/*.js"],
                    env: {"@admc.com/sn/sn_client_noiso": true },
                    rules: {
                      "@admc.com/sn/invalid-table-altscope": "off",
                      ...clientRules,
                    },
                },
            ]
        }
    }
};
