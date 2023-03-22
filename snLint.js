#!/usr/bin/env node

"use strict";

const { AppErr, conciseCatcher, conciseErrorHandler, getAppVersion, isPlainObject } =
  require("@admc.com/apputil");
const { validate } = require("@admc.com/bycontract-plus");
const joi = require("joi");
const strip = require("strip-comments");

const RCFILE = "sneslintrc.json";
const RETAIN_CONST_FILES =  // In addition to *.client_script
  ["sys_ui_script", "sys_script_validator", "sys_ui_page.processing_script"];
const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const yargs = require("yargs")(process.argv.slice(2)).
  fail((msg, err, yargs) => {
      if (err) throw err;
      console.error(msg);
      console.error(yargs.help());
      process.exit(251);
  }).
  strictOptions().
  usage(`SYNTAX:
$0 [-cdHIqrv] [-t sntbl] [-a scopealt] [-L '(-eslint-swit)'] dir/or/file.js...
  OR
$0 [-cdHIqrv] -p [-t sntbl] [-a scopealt] [-L '(-...)'] label/path.js < ...
  OR
... > $0 [-cdHIqrv] -p [-t sntbl] [-a scopealt] [-L '(-...)'] label/path.js
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
  option("I", {
      describe:
      "output Integer strings to stdout instead of text report.  Errors, Warnings, Code lines.  " +
        "Code lines omit blank lines and comment-only lines.",
      type: "boolean",
  }).
  option("a", {
      describe: "optional scope-alternative, such as 'global' or 'scoped-es5' for server scripts, "
        + "or 'iso' or 'noniso' for client scripts.  Defaults to the default alt for the table.",
      type: "string",
  }).
  option("c", {
      describe: "return code will be Count of rule failures rather than number of errored files.  "
        + "This switch is implied by -p switch.  The count includes warnings if -r also given.",
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
  option("r", {
      describe: "stRict mode.  Exit value counts tests with warnings as failures",
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

let passThruArgs;
let errorCount = 0;
let warnCount = 0;
let lineCount = 0;
let fileFailureCount = 0;
let allTables;
// From https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
const escapedCwd = (process.cwd() + path.sep).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const ALLOW_DEFINE_CMT = "/* eslint-disable-line no-redeclare, no-unused-vars, max-len */";
const RAWFN_TEST_PAT = /^\s*function\s*[(]/;  // We strip comments and ws before this test
const RAWFN_SUB_PAT = /\bfunction\s*[(]/;  // Allow for comments before substitution
const RAWFNCMT_SUB_PAT = /\bfunction\s*[(].*/;  // Allow for comments before substitution
const ENTIREFN_TEST_PAT = /^\s*function\s*[(][\s\S]+[}]\s*$/;  // We strip comments and ws before
const UNUSEDFNEXPR_1L_TEST_PAT = /^\s*[(]\s*function\s*[(].*[}][ \t\r]*(?:\n|$)/;
const UNUSEDFNEXPR_TEST_PAT = /^\s*[(]\s*function\s*[(]/;
const UNUSEDFNEXPR_SUB_PAT = /[(]\s*function\s*[(].*/;
const UNUSEDAREXPR_1L_TEST_PAT =
  /^\s*[(][^)]*[)][ \t]*=>[ \t]*[{].*[}][ \t\r]*(?:\n|$)|^\s*[(][^)]*[)][ \t]*=>[ \t]*[^\s{]/;
const UNUSEDAREXPR_TEST_PAT = /^\s*[(][^)]*[)]\s*=>/;
const UNUSEDAREXPR_SUB_PAT = /[(][^)]*[)][ \t]*=>.*/;
const RM_WHITESPACE_RE = /^(?=\n)$|^\s*|\s*$|\n\n+/gm;

/**
 * Returns the number of rule errors for specified script,
 * or number of rule errors and warnings if strict (r) mode set
 */
function lintFile(file, table, alt, readStdin=false) {
    // eslint-disable-next-line prefer-rest-params
    validate(arguments, ["string", "string", "string=", "boolean="]);
    let stdout, thisErrorCount = 0, thisWarnCount = 0;
    console.debug(`file (${file}) table (${table}) alt (${alt})`);
    let baseName = path.basename(file);
    if (table === "sa_pattern") {
        // Special filename requirements for transforming custom sa_pattern.ndl format.
        if (baseName.endsWith(".js")) throw new AppErr("Field sa_pattern.ndl contains a custom "
          + `format, not JavaScript, but you have specified filename '${baseName}".  `
          + "Consider using suffix '.txt'");
        baseName = baseName.slice(0, -"txt".length) + "js"; // eslint-disable-line prefer-template
    }
    const objName = baseName.replace(/[.][^.]+$/, "");
    const eslintArgs = passThruArgs ? passThruArgs.slice() : [];
    if (process.stdout.isTTY) eslintArgs.unshift("--color");
    let content = fs.readFileSync(readStdin ? 0 : file, "utf8");
    if (!(table in allTables)) throw new AppErr(`Unsupported table: ${table}`);
    if (alt === undefined) alt = allTables[table][0];
    if (!allTables[table].includes(alt))
        throw new AppErr(`'${alt}' not among table ${table} alts: ${allTables[table]}`);
    const pseudoPath = path.join(table, alt, baseName);
    console.debug(`pseudoPath: ${pseudoPath}`);
    const justCode = strip(content.replace(/\r/g, "").trim().replace(RM_WHITESPACE_RE, ""));
    lineCount += justCode.split("\n").length;
    /* eslint-disable prefer-template */
    if (table === "sp_widget.client_script") {
        // For widget client scripts, allow non-invoked anonymous function definition, if
        // it's the first thing in the scriptlet.
        if (RAWFN_TEST_PAT.test(justCode)) {
            content = content.replace(RAWFN_SUB_PAT, "api._dummy=function(") + ";";
            console.warn("Inserted dummy assignment before Angular anonymous function");
        }
    } else if (table === "sa_pattern") {
        const jsCodeBlocks = [];
        content.replace(/\t/g, "    ").replace(/\r/g, "").
          replace(/^\s*name = "([^"]+)"[\S\s]+?^\s*eval [{]"javascript: (|[\S\s]+?[^\\])"[}]/gm,
            (_dummy, g1, g2) => {
              jsCodeBlocks.push("function fn" + (jsCodeBlocks.length + 1)
                + g1.replace(/[^\w]/g, "") + "() { // eslint-disable-line no-unused-vars\n"
                + g2.replace(/\\"/g, '"').replace(/\\\\/g, "\\") + "\n}\n");
              return "<DUMMY>";  // Our goal is not to replace anything but to extract
          });
        content = jsCodeBlocks.join("\n");
    // Following case must be before the other *_script_include case:
    } else if (table.startsWith("sys_ux_")) {
        // For widget client scripts, allow incomplete traditional anonymous function definition,
        // if it's the first thing in the scriptlet.
        if (ENTIREFN_TEST_PAT.test(justCode)) {
            content = content.replace(RAWFNCMT_SUB_PAT,
              "($&  // eslint-disable-line no-unused-expressions, max-len") +
              "\n)  // eslint-disable-line semi\n";
            console.warn("Wrapped incomplete anonymous function");
        } else if (UNUSEDFNEXPR_1L_TEST_PAT.test(justCode)) {
            content = content.replace(UNUSEDFNEXPR_SUB_PAT,
              "$&  // eslint-disable-line no-unused-expressions, max-len, semi");
            console.warn("Inserted 1L unused-expr comment directive within anony function def.");
        } else if (UNUSEDFNEXPR_TEST_PAT.test(justCode)) {
            //console.warn(`£${justCode}>`);
            content = content.replace(
              UNUSEDFNEXPR_SUB_PAT, "$&  // eslint-disable-line no-unused-expressions, max-len");
            const segments = content.split(/[}]\s*[)]\s*\n/);
            if (segments.length > 0)
                content = content.slice(0, -segments[segments.length-1].length -1) +
                  "  // eslint-disable-line semi, max-len\n" + segments[segments.length-1];
            console.warn("Inserted ML unused-expr comment directive within anony function def.");
            //console.warn(`<${content}>`);
        } else if (UNUSEDAREXPR_1L_TEST_PAT.test(justCode)) {
            content = content.replace(UNUSEDAREXPR_SUB_PAT,
              "$&  // eslint-disable-line no-unused-expressions, max-len, semi");
            console.warn("Inserted 1L unused-expr comment directive within anony arrow fn def.");
        } else if (UNUSEDAREXPR_TEST_PAT.test(justCode)) {
            // Impossible to find end of code (before possible end comments) to effectively insert
            // a more narrow disable-semi directive, so we're forced to disable 'semi' globally:
            content = "/* eslint-disable semi */ " + content.replace(
              UNUSEDAREXPR_SUB_PAT, "$&  // eslint-disable-line no-unused-expressions, max-len");
            console.warn("Inserted ML unused-expr comment directive within anony arrow fn def.");
        }
    } else if (objName && /^[a-z_]\w*/i.test(objName) && table.endsWith("_script_include")) {
        if (new RegExp("\\b" + objName + "\\s*=[^~=<>]").test(content)) {
            content = content.replace(
              new RegExp("\\b" + objName + "(\\s*=[^~=<>])"), `${objName} ${ALLOW_DEFINE_CMT}$1`);
            console.warn("Inserted comment directives within SI object assignment");
        } else if (new RegExp("\\bfunction\\s+" + objName + "\\s*[(]").test(content)) {
            content = content.replace(
              new RegExp("\\bfunction(\\s+)" + objName + "(\\s*)[(]"),
                `function$1${objName} ${ALLOW_DEFINE_CMT}$2(`);
            console.warn("Inserted comment directives within SI function definition");
        } else if (new RegExp("\\bclass\\s+" + objName + "\\s*[{]").test(content)) {
            content = content.replace(new RegExp("\\bclass(\\s+)" + objName + "(\\s*)[{]"),
                `class$1${objName} ${ALLOW_DEFINE_CMT}$2{`);
            console.warn("Inserted comment directives within SI function definition");
        } else if (new RegExp("\\bclass\\s+" + objName
          + "\\s+extends\\s+\\S+\\s*[{]").test(content)) {
            content = content.replace(new RegExp("\\bclass(\\s+)" + objName
              + "(\\s+extends\\s+\\S+\\s*)[{]"), `class$1${objName} ${ALLOW_DEFINE_CMT}$2{`);
            console.warn("Inserted comment directives within SI function definition");
        }
    } else if (["catalog_script_client", "sys_script_client"].includes(table)
      && /\bfunction\s+on[A-Z]\w+\s*[(]/.test(content)) {
        content = content.replace(  // eslint-disable-next-line prefer-arrow-callback
          /\bfunction\s+on[A-Z]\w+\s*[(]/, function(m) { return m + ALLOW_DEFINE_CMT; });
        console.warn("Inserted arrow comment directives within client function definition");
    } else if (table.startsWith("sys_ui_action.") && !["global", "scoped-es5"].includes(alt)) {
        const ex = /^function\s*(\w+)/.exec(justCode);
        if (ex) {
            content += `\n${ex[1]}();  // eslint-disable-line @admc.com/sn/immediate-iife\n`;
            console.warn("Appended dummy client function invocation");
        }
    }
    /* eslint-enable prefer-template */
    eslintArgs.splice(0, 0,
        path.join(require.resolve("eslint"), "../../bin/eslint.js"),
        "-c",
        "sneslintrc.json",
        "--no-eslintrc",
        "--resolve-plugins-relative-to", path.join(__dirname, ".."),  // reqd for global installs
        "--exit-on-fatal-error",
        "--stdin",
        "--stdin-filename",
        pseudoPath,
    );
    if (yargsDict.H) eslintArgs.splice(1, 0, "-f", "html");
    if (yargsDict.r) eslintArgs.splice(1, 0, "--max-warnings", "0");
    console.debug('eslint invocation args', eslintArgs);
    const pObj = childProcess.spawnSync(process.execPath, eslintArgs, {
        input:
          ["noniso", "iso", "scoped-es12"].includes(alt) ||
          alt.includes("es12") && baseName.endsWith("-condition.js") ||
          table.includes("client_script") || RETAIN_CONST_FILES.includes(table)
          ? content : content.replace(/(;|^|\s)const(\s)/g, "$1var$2"),
    });
    process.stderr.write(pObj.stderr.toString("utf8"));
    if (yargsDict.H) {
        /* eslint-disable prefer-template */
        if ("".replaceAll === undefined) {
            // Workaround for old node.js
            stdout = pObj.stdout.toString("utf8");
            while (stdout.includes("[+] " + process.cwd() + path.sep, "[+] "))
                stdout = stdout.replace("[+] " + process.cwd() + path.sep, "[+] ");
        } else {
            stdout = pObj.stdout.toString("utf8").
              replaceAll("[+] " + process.cwd() + path.sep, "[+] ");
        }
        /* eslint-enable prefer-template */
    } else {
        stdout = pObj.stdout.toString("utf8").  // eslint-disable-next-line prefer-template
          replace(new RegExp("(\u001b...|\\n)" + escapedCwd, "g"), "$1");
    }
    if (pObj.status !== 0) fileFailureCount++;
    if (stdout.includes("Using globalsDir '"))
        // This is the only debug message output by the parser.
        stdout = stdout.replace(/^Using globalsDir '.*\r?\n/, "");
    if (stdout && (pObj.status !== 0 || !stdout.includes("<span>0 problems</span>"))) {
        const probMatches = /\d problem.*[(](\d+) errors?, (\d+) warning/.exec(stdout);
        if (!probMatches)
            throw new Error(`We couldn't find problem counts in the output: ${stdout}`);
        thisErrorCount += parseInt(probMatches[1]);
        thisWarnCount += parseInt(probMatches[2]);
        errorCount += thisErrorCount;
        warnCount += thisWarnCount;
        if (!yargsDict.I && table === "sa_pattern" && thisErrorCount + thisWarnCount > 0) {
            const generatedCode = content.split("\n").map((cdStr, cdNum) =>
                `${cdNum+1}:  ${cdStr}`
            ).join("\n");
            // Checks show that snLint writes no \r's or \t's:
            if (yargsDict.H)
                stdout = stdout.replace(/<[/]table>(\n *)<script\b/,
                  // eslint-disable-next-line prefer-template
                  '</table>\n<pre style="font-size: medium; background-color: silver;">'
                  + generatedCode.replace(/[$]/g, "$$$$")
                  + "\n</pre>$1<script");
            else  // eslint-disable-next-line prefer-template
                stdout = "Generated code:\n" + generatedCode + "=".repeat(76) + stdout;
        }
    }
    if (stdout && !yargsDict.I) process.stdout.write(stdout);
    return yargsDict.r ? thisWarnCount + thisErrorCount : thisErrorCount;
}

/**
 * Skips directories matching .* and 'node_modules'
 * @param an fs.Dir instance
 *
 * @returns Array of recursively matching filepaths, may have 0 elements
 */
function jsFilesInBranch(fsDir) {
    validate(arguments, ["object"]);  // eslint-disable-line prefer-rest-params
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

conciseCatcher(async (params) => {
    validate(params, []);
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
    if (yargsDict.H && yargsDict.I) {
        console.error("Switches -H and -I are mutually exclusive");
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
    let customRC;

    if (!fs.existsSync(RCFILE) || !fs.statSync(RCFILE).isFile(RCFILE))
        throw new AppErr(`'${RCFILE}' does not exist or is not a file`);
    const snesExports = require("./exports");
    if (!snesExports || !isPlainObject(snesExports))
        throw new AppErr("eslint-plugin-rc does not have valid 'exports.js'");
    joi.assert(snesExports, joi.object({
        configs: joi.object({
            servicenow: joi.object({
                settings: joi.object({
                    ootbTables: joi.object()
                }).unknown()
            }).unknown()
        }).unknown()
    }).unknown(), new AppErr(
        "eslint-plugin-rc exports.js missing 'configs.servicenow.settings.ootbTables' map"),
      { presence: "required" });
    const ootbTables = snesExports.configs.servicenow.settings.ootbTables;
    allTables = {};
    for (const t in ootbTables)
        if (Array.isArray(ootbTables[t])) {
            if (ootbTables[t].length < 1)
                throw new AppErr("eslint-plugin-rc 'configs.servicenow.settings.ootbTables' "
                  + `length ${ootbTables[t].length}`);
            if (ootbTables[t].some(a => typeof a !== "string"))
                throw new AppErr("eslint-plugin-rc 'configs.servicenow.settings.ootbTables' "
                  + "has a non-string element");
            allTables[t] = ootbTables[t];
        } else {
            throw new AppErr("eslint-plugin-rc 'configs.servicenow.settings.ootbTables' "
              + `has unexpected type: ${typeof ootbTables[t]}`);
        }
    try {
        customRC = require("json-easy-strip")(RCFILE);
    } catch (parseE) {
        throw new AppErr(`'${RCFILE}' does not contain valid JSON: ${parseE}`);
    }
    if (!isPlainObject(customRC))
        throw new AppErr(`'${RCFILE}' does not contain JSON object but: ${typeof customRC}`);
    if ("settings" in customRC) {
        if (!isPlainObject(customRC.settings))
            throw new AppErr(`'${RCFILE}' 'settings' not a plain object`);
        if ("customTables" in customRC.settings) {
            const custTables = customRC.settings.customTables;
            if (!isPlainObject(custTables))
                throw new AppErr(`'${RCFILE}' optional 'settings.customTables' not a plain object`);
            for (const t in custTables)
                /* eslint-disable max-depth */
                if (Array.isArray(custTables[t])) {
                    if (custTables[t].length < 1)
                        throw new AppErr(`'${RCFILE}' 'settings.customTables' `
                          + `length ${custTables[t].length}`);
                    if (custTables[t].some(a => typeof a !== "string"))
                        throw new AppErr(`'${RCFILE}' 'settings.customTables' `
                          + "has a non-string element");
                    allTables[t] = custTables[t];
                } else {
                    throw new AppErr(`'${RCFILE}' 'settings.customTables' `
                      + `has unexpected type: ${typeof custTables[t]}`);
                }
                /* eslint-enable max-depth */
        }
    }
    if (yargsDict.p) {
        const retVal = lintFile(yargsDict._[0],
          yargsDict.t ? yargsDict.t : path.basename(path.dirname(yargsDict._[0])),
          yargsDict.a, true);
        if (yargsDict.I)
            process.stdout.write(`${errorCount}\n${warnCount}\n${lineCount}\n`);
        process.exit(retVal);
    }

    const files = [];
    yargsDict._.forEach(inputNode => {
        if (!fs.existsSync(inputNode)) throw new AppErr(`'${inputNode}' does not exist`);
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
    if (yargsDict.I) process.stdout.write(`${errorCount}\n${warnCount}\n${lineCount}\n`);
    process.exit(yargsDict.c ?  // eslint-disable-next-line no-extra-parens
      (yargsDict.r ? warnCount + errorCount : errorCount) : fileFailureCount);
}, 254)().catch(e0=>conciseErrorHandler(e0, 253));
