#!/usr/bin/env node

"use strict";

const { AppErr, conciseCatcher, conciseErrorHandler, getAppVersion } = require("@admc.com/apputil");
const { validate } = require("@admc.com/bycontract-plus");

const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const yargs = require("yargs")(process.argv.slice(2)).
  strictOptions().
  usage(`SYNTAX:
$0 [-cdHqv] [-t sntbl] [-a scopealt] [-L '(-eslint-switches)'] dir/or/file.js...
  OR
$0 [-cdHqv] -p [-t sntbl] [-a scopealt] [-L '(-...)'] label/path.js < ...
  OR
... > $0 [-cdHqv] -p [-t sntbl] [-a scopealt] [-L '(-...)'] label/path.js
  OR     $0 -h|-s|-g

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

Most -eslint-switches related to config files, fixing, file selection or
caching will probably break things.  Safe to use for things like config setting
overrides, 'Handling warnings', 'Output', 'Inline...comments', 'Miscellaneous'
(headings from 'eslint --help' description).

Since you can specify at most one scopealt with -a switch, all input files must
have the same scopealt (or none).  Similarly for target table with -t switch
except that if you specify no -t then each file's table name will derive from
that file's directory.  If using stdin with -p switch, then you can specify
just one fake file path.

Directories are searched recursively for *.js files, with exclusions, like
'eslint', but we don't yet support .eslintignore files or --ext switch.`.replace(/ /g, "\u2009")).
  option("v", {
      describe: "Verbose.  N.b. may display passwords!",
      type: "boolean",
  }).
  option("H", {
      describe: "output HTML instead of plain text report",
      type: "boolean",
  }).
  option("a", {
      describe: "optional scope-alternative, such as 'global' or 'scoped' for server scripts, "
        + "or 'iso' or 'noniso' for client scripts",
      type: "string",
  }).
  option("c", {
      describe: "return code will be Count of rule failures rather than number of errored files.  "
        + "this switch is implied by -p switch",
      type: "boolean",
  }).
  option("d", { describe: "Debug logging", type: "boolean", }).
  option("g", {
      describe: "populate 'snglobals' subdirectory (of current directory)",
      type: "boolean",
  }).
  option("L", {
      describe: `pass-through parameters for esLint.
Quote, parenthesize, and comma-delimite all the Lint args like so:  `
        + `'(-f,html,--rule,{"prefer-template": "off"})'`,
      type: "string",
  }).
  option("q", {
      describe: "Quiet logging by logging only at level WARN and ERROR",
      type: "boolean",
  }).
  option("p", {
      describe: "Read input code from stdin Pipe rather than from a file.  " +
        "Specified single file path is used for labelling and table determination (if no -t)",
      type: "boolean",
  }).
  option("s", {
      describe: "write template 'sneslintrc.json' Sample file into current directory",
      type: "boolean",
  }).
  option("t", {
      describe:
        "target Table.  If -t and -T not set then we use the directory name of the specified path",
      type: "string",
  }).
  alias("help", "h").
  version(getAppVersion(__dirname));
const yargsDict = yargs.argv;
const progName = yargsDict.$0.replace(/^.*[\\/]/, "");  // eslint-disable-line no-unused-vars

if (!yargsDict.d) console.debug = () => {};
if (yargsDict.q) console.debug = console.log = console.info = () => {};

function isSI(tableName) {
    return tableName.includes("_script_include");
}

let passThruArgs;
let errorCount = 0;
let fileFailureCount = 0;
// From https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
const escapedCwd = (process.cwd() + path.sep).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Returns the number of rule errors for specified script
 */
function lintFile(file, table, alt, readStdin=false) {
    validate(arguments, ["string", "string", "string=", "boolean="]);
    let stdout, thisErrorCount = 0;
    console.debug(`file (${file}) table (${table}) alt (${alt})`);
    const baseName = path.basename(file);
    const objName = baseName.replace(/[.][^.]+$/, "");
    const eslintArgs = passThruArgs ? passThruArgs.slice() : [];
    if (process.stdout.isTTY) eslintArgs.unshift("--color");
    const content = fs.readFileSync(readStdin ? 0 : file, "utf8");
    let pseudoDir = table;
    if (alt === undefined) {
        // Goal here is to set the default alt to match simplest created ServiceNow record
        if (!table.includes("mid_") && !table.includes("ecc")
          && !table.includes("_client") && table !== "sys_ui_script"
          && !table.startsWith("sys_ui_policy") && !table.startsWith("sa_")) alt = "global";
        else if (table.includes("_client") || table.startsWith("sys_ui_policy")) alt = "iso";
    }
    if (alt !== undefined) pseudoDir = path.join(pseudoDir, alt);
    const pseudoPath = path.join(pseudoDir, baseName);
    console.debug(`pseudoPath: ${pseudoPath}`);
    if (objName && isSI(table)) eslintArgs.splice(0, 0, "--rule",
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
    const pObj = childProcess.spawnSync(process.execPath, eslintArgs, {
        input:
          alt === "noniso" || alt === "iso" || table === "sys_ui_script"
          ? content : content.replace(/(;|^|\s)const(\s)/g, "$1var$2"),
    });
    process.stderr.write(pObj.stderr.toString("utf8"));
    if (yargsDict.H) {  // eslint-disable-next-line prefer-template
        stdout = pObj.stdout.toString("utf8").replaceAll("[+] " + process.cwd() + path.sep, "[+] ");
    } else {
        stdout = pObj.stdout.toString("utf8").  // eslint-disable-next-line prefer-template
          replace(new RegExp("(\u001b...|\\n)" + escapedCwd, "g"), "$1");
    }
    if (pObj.status !== 0) {
        fileFailureCount++;
        let errMatches;
        if (yargsDict.H) {
            errMatches = /[(](\d+) errors?,/.exec(stdout);
            if (!errMatches)
                throw new Error(`We could find error counts in the output: ${stdout}`);
            thisErrorCount += parseInt(errMatches[1]);
        } else {
            errMatches = stdout.match(
              /\d+:\d+\u001b....  \u001b....error\u001b|\n  \d+:\d+  error  /g);
            if (errMatches === null) throw new AppErr(
              `ESLint returned error but we could find no rule errors in the output: ${stdout}`);
            thisErrorCount += errMatches.length;
        }
        errorCount += thisErrorCount;
    }
    process.stdout.write(stdout);
    return thisErrorCount;
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
            process.exit(255);
        }
        fs.copyFileSync(path.join(__dirname, "resources/sneslintrc.json"), targRcFile);
        console.info(`Created file '${targRcFile}'`);
        process.exit(0);
    }
    if (yargsDict.g) {
        fs.cpSync(path.join(__dirname, "resources/snglobals"), "snglobals", {
            preserveTimestamps: true,
            recursive: true,
            force: true,
        });
        console.info("Populated directory 'snglobals'");
        process.exit(0);
    }
    if (yargsDict._.length < 1) {
        console.error("You must specify a 'filepath.js' param unless using a -g, -h, or -s switch");
        yargs.showHelp();
        process.exit(255);
    }
    if (yargsDict.p && yargsDict._.length > 1) {
        console.error("You must specify just one label path when using -p switch");
        yargs.showHelp();
        process.exit(255);
    }
    if (yargsDict.H && yargsDict._.length > 1) {
        console.error(`I haven't yet implemented generation of a merged HTML report."
Until I do, run snLint with -H once for each input file to generate it's HTML,
then merge those HTML files with 'mergeEslintHtml.js'.`);
        process.exit(255);
    }
    if (yargsDict.L) {
        if (!/^[(].+[)]$/.test(yargsDict.L)) {
            console.error(`The value for -L switch must be OS-isolated (most easily by 
    using quotes) and then be of format: (first param,second param,third param)`);
            process.exit(255);
        }
        passThruArgs = yargsDict.L.slice(1, -1).split(",");
    }
    if (yargsDict.t && !/^[a-z][\w.]*$/.test(yargsDict.t))
        throw new AppErr(`Target table from -t switch is invalid: ${yargsDict.t}`);
    if (yargsDict.p)
        process.exit(lintFile(yargsDict._[0],
          yargsDict.t ? yargsDict.t : path.basename(path.dirname(yargsDict._[0])),
          yargsDict.a, true));
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
        if (!/^[a-z][\w.]*$/.test(t))
            throw new AppErr(`Target table from source file directory is invalid: ${t}`);
    });
    files.forEach(srcFilePath => {
        lintFile(srcFilePath,
          yargsDict.t ? yargsDict.t : path.basename(path.dirname(srcFilePath)), yargsDict.a);
    });
    process.exit(yargsDict.c ? errorCount : fileFailureCount);
}, 254)().catch(e0=>conciseErrorHandler(e0, 253));
