#!/usr/bin/env node

"use strict";

const { AppErr, conciseCatcher, conciseErrorHandler, getAppVersion } = require("@admc.com/apputil");
const { validate } = require("@admc.com/bycontract-plus");

const fs = require("fs");
const path = require("path");

const yargs = require("yargs")(process.argv.slice(2)).
  strictOptions().
  usage(`SYNTAX: $0 [-dHqv] [-t sntbl] [-a scopealt] [-- -eslint-switches] dir/or/file.js...
  OR     $0 -h     OR
         $0 -s
         $0 -g

The most important differences from invoking 'eslint' directly are:
    1. Internally we use -c and --no-eslintrc, so that only config file
       './sneslintrc.json' is honored.  NOT '.eslintrc.*'!
       You must have this file in place.
       You can generate it with the -s switch.  No cascading RC files.
    2. Internally we use --stdin and we generate a pseudo input file path,
       so if you use overrides in './sneslintrc.json', you must match against
       pseudo-paths of format 'TABLENAME/BASENAME.js' or
       'TABLENAME/ALTSCOPE/BASENAME.js'.  Example: "sys_script/global/sane.js"
       Use -d switch for ESLint to display the pseudo path that it uses.
    3. Since we pipe input, you can't use any fix or caching features.

Set env variable SN_FORCE_COLOR to true to force ESLint to output colorized
text (some terminal or shell setups cause ESLint to default to no-color).

Most -eslint-switches related to config files, fixing, file selection or
caching will probably break things.  Safe to use for things like config setting
overrides, 'Handling warnings', 'Output', 'Inline...comments', 'Miscellaneous'
(headings from 'eslint --help' description).

Since you can specify at most one scopealt with -a switch, all input files must
have the same scopealt (or none).  Similarly for target table with -t switch
except that if you specify no -t then each file's table name will derive from
that file's directory.`).
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
  option("g", {
      describe: "populate 'snglobals' as new subdirectory of current directory",
      type: "boolean",
  }).
  option("q", {
      describe: "Quiet logging by logging only at level WARN and ERROR",
      type: "boolean",
  }).
  option("s", {
      describe: "write template 'sneslintrc.json' Sample file into current directory",
      type: "boolean",
  }).
  option("t", {
      describe: "target Table.  If not set then we use the directory name of the specified file",
      type: "string",
  }).
  alias("help", "h").
  version(getAppVersion(__dirname));
const yargsDict = yargs.argv;
const progName = yargsDict.$0.replace(/^.*[\\/]/, "");  // eslint-disable-line no-unused-vars

if (!yargsDict.d) console.debug = () => {};
if (yargsDict.q) console.debug = console.log = console.info = () => {};

/* Luckly only need to decide between JavaScript script tables
 * (because there are non-JS tables like *ecc* and *mid*).
 */
function isServerScript(tableName) {
    return !tableName.includes("mid") &&
      !tableName.includes("ecc") && !tableName.includes("client");
}
function isClientScript(tableName) {
    return tableName.includes("client");
}
function isSI(tableName) {
    return tableName.includes("_script_include");
}

const sleepMs = ms => new Promise(res => { setTimeout(res, ms); } );
let errorCount = 0, activeJobs = 0;

async function lintFile(file, table, alt) {
    validate(arguments, ["string", "string", "string="]);
    console.debug(`file (${file}) table (${table}) alt (${alt})`);
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
    eslintArgs.splice(0, 0,
        path.join(require.resolve("eslint"), "../../bin/eslint.js"),
        "-c",
        "sneslintrc.json",
        "--no-eslintrc",
        "--resolve-plugins-relative-to", path.join(__dirname, ".."),  // reqd for global installs
        "--stdin",
        "--stdin-filename",
        pseudoPath,
    );
    if (yargsDict.H) eslintArgs.splice(1, 0, "-f", "html");
    console.debug('eslint invocation args', eslintArgs);
    const childProcess = require("child_process").spawn(process.execPath, eslintArgs, {
        stdio: ["pipe", "inherit", "inherit"],
    });
    activeJobs++;
    childProcess.stdin.write(isClientScript(table)
        ? content
        : content.replace(/(;|^|\s)const(\s)/g, "$1var$2"));
    childProcess.stdin.end();
    while (childProcess.exitCode === null) await sleepMs(10);
    if (childProcess.exitCode !== 0) errorCount++;
    --activeJobs;
    if (activeJobs < 1) process.exit(errorCount);
    /* fs design makes it very difficult to just wait synchronously as we want to:
    childProcess.on("exit", ()=> {
        if (childProcess.exitCode !== 0) process.exit(childProcess.exitCode);
    }); */
}

/**
 * Skips directories matching .* and 'node_modules'
 * @param an fs.Dir instance
 *
 * @returns Array of recursively matching filepaths, may have 0 elements
 */
function jsFilesInBranch(fsDir) {
    validate(arguments, ["object"]);
    let dirent, entPath;
    const outputList = [];

    while ((dirent = fsDir.readSync()) !== null) {
        if (dirent.name.startsWith(".")) continue;
        if (dirent.name === "node_modules") continue;
        entPath = path.join(fsDir.path, dirent.name);
        if (dirent.isDirectory())
            Array.prototype.push.apply(outputList,
              jsFilesInBranch(fs.opendirSync(entPath)));
        else if (dirent.name.endsWith(".js") && dirent.isFile())
            outputList.push(entPath);
    }
    fsDir.closeSync();
    return outputList;
}

conciseCatcher(async function() {
    validate(arguments, []);
    if (yargsDict.s) {
        const targRcFile = "sneslintrc.json";
        if (fs.existsSync(targRcFile)) {
            console.error(`Refusing to overwrite existing '${targRcFile}'`);
            process.exit(8);
        }
        fs.copyFileSync(path.join(__dirname, "resources/sneslintrc.json"), targRcFile);
        console.info(`Created file '${targRcFile}'`);
        process.exit(0);
    }
    if (yargsDict.g) {
        if (fs.existsSync("snglobals")) {
            console.error("Refusing to update existing 'snglobals'");
            process.exit(8);
        }
        fs.cpSync(path.join(__dirname, "resources/snglobals"), "snglobals", {
            preserveTimestamps: true,
            recursive: true,
        });
        console.info("Populated new directory 'snglobals'");
        process.exit(0);
    }
    if (yargsDict._.length < 1) {
        console.error("You must specify a 'filepath.js' param unless using a -h, -r, or -s switch");
        yargs.showHelp();
        process.exit(9);
    }
    if (yargsDict.t && !/^[a-z]\w*$/.test(yargsDict.t))
        throw new AppErr(`Target table from -t switch is invalid: ${yargsDict.t}`);
    const files = [];
    yargsDict._.forEach(inputNode => {
        if (!fs.existsSync(inputNode)) throw new AppErr(`'${inputNode}' does not exists`);
        if (fs.statSync(inputNode).isDirectory(inputNode)) {
            Array.prototype.push.apply(files, jsFilesInBranch(fs.opendirSync(inputNode)));
        } else {
            files.push(inputNode);
        }
    });
    // eslint-disable-next-line prefer-template
    console.debug(files.length + " source file matches:\n" + files.join("\n"));
    // First validate input files
    files.forEach(srcFilePath => {
        const t = yargsDict.t ? yargsDict.t : path.basename(path.dirname(srcFilePath));
        if (!/^[a-z]\w*$/.test(t))
            throw new AppErr(`Target table from source file directory is invalid: ${t}`);
    });
    // Process input files.  I just can't this to process multiple strictly synchronously
    files.forEach(srcFilePath => {
        lintFile(srcFilePath,
          yargsDict.t ? yargsDict.t : path.basename(path.dirname(srcFilePath)), yargsDict.a);
    });
}, 10)().catch(e0=>conciseErrorHandler(e0, 1));
