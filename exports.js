const constsFromFile = file => {
    const pObj = {};
    pObj[file] = true;
    return pObj;
};

const allRules = require("requireindex")(require("path").join(__dirname, "rules"));

module.exports = {
    rules: allRules,
    environments: {
        sn_bg: { globals: constsFromFile("aglob") },
        sn_mid: { globals: constsFromFile("bglob") },
        sn_client: { globals: { } },
        sn_bg_scoped: { globals: constsFromFile("cglob") },
        sn_client_noiso: { globals: { } }
    },
    configs: {
        servicenow: {
            extends: ["eslint:recommended"],
            rules: {},
            /* Once have rules:
               rules: {
                 ...Object.fromEntries(Object.entries(
                     (({rule1,rule2})=>({rule1,rule2}))(allRules)
                 ).map(([k,v]) => [k, "error"])),
                 ...Object.fromEntries(Object.entries(
                     (({rule1,rule2})=>({rule3,rule4}))(allRules)
                 ).map(([k,v]) => [k, "warn"]))
               },
            */
            
            overrides: [
                {
                    files: [
                        "**/@(sys_script_fix|sys_script|sys_script_include)/global/*.js"
                    ],
                    env: {"@admc.com/sn/sn_bg": true }
                },
                {
                    files: [
                        "**/ecc_queue_script_include/*.js"
                    ],
                    env: {"@admc.com/sn/sn_mid": true }
                },
                {
                    files: [
                        "**/@(sys_script_fix|sys_script|sys_script_include)/scoped/*.js"
                    ],
                    env: {"@admc.com/sn/sn_bg_scoped": true }
                }
            ]
        }
    }
};
