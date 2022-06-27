#!/usr/bin/env node

"use srict";

const { AppErr, conciseCatcher, conciseErrorHandler, getAppVersion } = require("@admc.com/apputil");
const { validate } = require("@admc.com/bycontract-plus");

const fs = require("fs");
const path = require("path");

const yargs = require("yargs")(process.argv.slice(2)).
  strictOptions().
  usage(`SYNTAX: $0 [-dHqv] [-t sn_table] [-a scopealt] [-- -eslint-switches] file/path.js
  OR     $0 -h     OR
         $0 -s rc/directory
It is critically important to have ServiceNow-specific .eslintrc* file(s) set
up in the file/path.js directory and/or ancestor directories.
Use -s switch to generate one.
You can't pass any source file-related switches to eslint (after "--") because
that would conflict with the file wrapping that we need to do.
Set env variable SN_FORCE_COLOR to true to force ESLint to output colorized
text (some terminal or shell setups cause ESLint to default to no-color).
I will be enhancing this script to handle multiple input file paths and
directories, but for now invoke $0 once for each source file.`).
  option("v", {
      describe: "Verbose.  N.b. may display passwords!",
      type: "boolean",
  }).
  option("H", {
      describe: "output HTML instead of plain text report",
      type: "boolean",
  }).
  option("a", {
      describe: "optional scope-alternative, such as 'global' or 'scoped' for server scripts, " +
        "or 'iso' or 'noniso' for client scripts",
      type: "string",
  }).
  option("d", { describe: "Debug logging", type: "boolean", }).
  option("q", {
      describe: "Quiet logging by logging only at level WARN and ERROR",
      type: "boolean",
  }).
  option("s", {
      describe: "directory to write template '.eslintrc.json' Sample file into",
      type: "string",
  }).
  option("t", {
      describe: "target Table.  If not set then we use the directory name of the specified file",
      type: "string",
  }).
  alias("help", "h").
  version(getAppVersion(__dirname));
const yargsDict = yargs.argv;
const progName = yargsDict.$0.replace(/^.*[\\/]/, "");  // eslint-disable-line no-unused-vars
let targRcFile;

if (!yargsDict.d) console.debug = () => {};
if (yargsDict.q) console.debug = console.log = console.info = () => {};

function isServerScript(tableName) {
    return (!tableName.includes("mid")
      || !tableName.includes("ecc") || !tableName.includes("client"));
}
function isClientScript(tableName) {
    return tableName.includes("client");
}
function isSI(tableName) {
    return tableName.includes("_script_include");
}

function lintFile(file, table, alt) {
    validate(arguments, ["string", "string", "string="]);
    console.debug(`file (${file}) table (${table}) alt(${alt})`);
    const baseName = path.basename(file);
    const objName = baseName.replace(/[.][^.]+$/, "");
    const eslintArgs = yargsDict._.slice();
    if (process.env.SN_FORCE_COLOR) eslintArgs.unshift("--color");
    const content = fs.readFileSync(file, "utf8");
    let pseudoDir = table;
    if (alt === undefined) {
        if (isServerScript(table)) alt = "global";
        if (isClientScript(table)) alt = "iso";
    }
    if (alt !== undefined) pseudoDir = path.join(pseudoDir, alt);
    const pseudoPath = path.join(pseudoDir, baseName);
    console.debug(`pseudoPath: ${pseudoPath}`);
    if (isSI(table)) eslintArgs.splice(0, 0, "--rule",
        JSON.stringify({ "no-unused-vars": ["error", { varsIgnorePattern: `^${objName}$` }] }));
    else if (table === "sys_script_client") eslintArgs.splice(0, 0, "--rule", JSON.stringify({
        "no-unused-vars": ["error", { varsIgnorePattern: "^on(Load|Change|CellEdit|Submit)$" }]
    }));
    eslintArgs.splice(0, 0,
        path.join(require.resolve("eslint"), "../../bin/eslint.js"),
        "--stdin",
        "--stdin-filename",
        pseudoPath,
        // TODO:  Test if necessary now that design completed
        //"--resolve-plugins-relative-to",  __dirname),
    );
    if (yargsDict.H) eslintArgs.splice(1, 0, "-f", "html");
    console.debug('eslint invocation args', eslintArgs);
    const childProcess = require("child_process").spawn(process.execPath, eslintArgs, {
        stdio: ["pipe", "inherit", "inherit"],
    });
    if (isServerScript(table)) {
        childProcess.stdin.write(content.replace(/(\s)const(\s)/g, "$1var$2"));
        childProcess.stdin.end();
    }
    childProcess.on("exit", ()=> {
        if (childProcess.exitCode !== 0) process.exit(childProcess.exitCode);
    });
}

conciseCatcher(async function() {
    validate(arguments, []);
    if (yargsDict.s) {
        targRcFile = path.join(yargsDict.s, ".eslintrc.json");
        if (fs.existsSync(targRcFile)) {
            console.error(`Refusing to overwrite existing '${targRcFile}'`);
            process.exit(8);
        }
        fs.copyFileSync(path.join(__dirname, "resources/eslintrc-example.json"), targRcFile);
        process.exit(0);
    }
    if (yargsDict._.length < 1) {
        console.error("You must specify a 'filepath.js' param unless using a -h, -r, or -s switch");
        yargs.showHelp();
        process.exit(9);
    }
    const srcFilePath = yargsDict._.pop();
    if (!fs.existsSync(srcFilePath)) throw new AppErr(`'${srcFilePath}' does not exists`);
    const t = yargsDict.t ? yargsDict.t : path.basename(path.dirname(srcFilePath));
    if (!/^[a-z]\w*$/.test(t))
        throw new AppErr(`Target table from -t switch or source file directory is invalid: ${t}`);
    lintFile(srcFilePath, t, yargsDict.a);
}, 10)().catch(e0=>conciseErrorHandler(e0, 1));
