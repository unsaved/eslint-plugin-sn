# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`@admc.com/eslint-plugin-sn` is an ESLint plugin for linting ServiceNow JavaScript scriptlets. It
ships both as an ESLint plugin (used via `.eslintrc` config) and as a standalone CLI tool `snLint`
that preprocesses ServiceNow scriptlets before passing them to ESLint.

## Commands

```bash
npm test          # run all mocha tests
npm run lint      # run eslint on this project's own source
npm run toc       # regenerate README.md table of contents from doc/README.md
```

Run a single test file:

```bash
npx mocha test/validate-gliderecord-calls-test.js
```

Generate a template `sneslintrc.json` in the current directory (ES2018 client):

```bash
node snLint.js -s
```

Generate a template `sneslintrc.json` (ES2022 clients):

```bash
node snLint.js -S
```

Populate a `snglobals/` directory in the current directory:

```bash
node snLint.js -g
```

## Architecture

### Two entry points

- **`exports.js`** — the ESLint plugin entry point (`main` in package.json). Exports `rules`,
  `environments`, and `configs`. The `configs.servicenow` config extends `eslint:recommended` and
  applies a large `overrides` array that maps ServiceNow table/alt pseudo-path patterns to specific
  rule sets. Also loads `tableSpecifics.json` (and optional `tableSpecifics-local.json`) to
  generate per-table IIFE globals dynamically.
- **`snLint.js`** — the CLI binary. Accepts SN scriptlet files or directories, preprocesses the
  code to make ES5-era SN patterns (bare functions, arrow expressions, `const`) parseable by
  ESLint, constructs a pseudo-path like `tablename/alt/basename.js`, then pipes the code to
  `eslint --stdin`. Does NOT use `.eslintrc.*`; requires `sneslintrc.json` in the working
  directory.

### File path conventions (pseudo-paths)

`snLint` and the ESLint overrides both rely on pseudo-paths in the form:

```
<table>/<alt>/<name>.js
```

Where `<alt>` is one of: `global`, `scoped-es5`, `scoped-es12`, `global-es12`, `iso`, `noniso`,
`all`, or compound variants like `iso_global`, `noniso_scoped-es5`, etc.

The `overrides` array in `exports.js` uses glob patterns against these pseudo-paths to apply
table- and scope-specific ESLint rules.

### Globals resolution (`lib/resolveGlobalsDir.js`)

Walks up the directory tree from CWD looking for a `snglobals/` directory, then falls back to
`~/snglobals/`. Throws if not found. The `snglobals/` directory contains `.txt` files listing
allowed global identifiers (one per line, `#` and `//` comments supported) and
`tableSpecifics.json` for per-table IIFE parameter globals.

To extend globals for your org, create `-local` variants of the txt files (e.g.,
`SIScopes-local.txt`) alongside the OOTB files — these are merged at load time without modifying
the shipped files.

### Rules (`rules/`)

Each rule is a CommonJS module exporting a standard ESLint rule object with `meta` and `create`.
The `messageId` for each rule is derived from its filename: `FILENAME_msg` uppercased (e.g.,
`NO_LOG_GLOBAL_MSG`). Rules are auto-loaded via `requireindex` in `exports.js`.

### Tests (`test/`)

Each test file corresponds to one rule and uses ESLint's built-in `RuleTester`. Test files are
named `<rule-name>-test.js`. The `baseName` convention strips `-test.js` from `__filename` to
derive the rule name and `messageId`.

### Code preprocessing (`snLint.js` `transformCodeForESLint`)

For `global` and `scoped-es5` server-side scripts, `snLint` transforms code before linting:
- Replaces `const` with `var` (ES5 compatibility)
- Replaces backtick strings with `"BACKTICK_REPLACEMENT"` (preserving line count)
- Converts arrow function syntax to `function` declarations

Table-specific preprocessing also handles: Angular widget client scripts, UIB `sys_ux_*`
incomplete function expressions, `sp_widget.link` arrow functions, Script Include class/function
definitions, and `sa_pattern` NDL format extraction.

---

For all of the Coding Standards I give, use the rules not only when you are providing complete
scripts, but for all instructions and examples in your conversational messages.

## Language-independent Coding Conventions
- **Line Limit**: Adhere to a 100-character line limit for all files.
- **Indentation** (No tabs):
  - 4 spaces for programming, scripting, and shell languages.
  - 2 spaces for HTML, data formats like JSON, XML, and programming/scripting line continuations.
- **Shebang**: All directly invokable scripts must include a shebang using `/usr/bin/env` (e.g.,
  `#!/usr/bin/env node` or `#!/usr/bin/env bash`) to support PATH-based runtime and multiple
  interpreter switches.
- **Flow Control**: Minimize nesting levels. Perform error/special-state checking early and
  exit/return/continue/break immediately. Keep the "happy path" as the main, un-nested code flow.
  Handle and continue only if good (e.g., `handle_error || continue`), avoiding `if/else` where
  possible.
- **Naming**: Use descriptive, multi-word variable names that convey meaning without being overly
  verbose.
- **Trailing whitespace**: No useless (per-line) trailing whitespace

## JavaScript Code Standards
- **Syntax**: Use modern ES6+ (Arrow functions, `for...of` statements, destructuring, `const`/`let`).
- **Arrow Functions**: Use syntax shortcuts for brevity: omit parentheses for single parameters
  and omit braces/return for single-expression bodies.
- **Strings**: Use backtick template literals with `${}` interpolation instead of explicit string
  concatenation.
- **Strings**: To facilitate usage of multiline backtick strings without needing the string
  constant lines to make a mess by not being indented with the adjoining code, use function `deden`
  from npm module `@admc.com/apputil`.
- **Strings**: When you need a string constant without line breaks that's longer than 100 line
  length max allows, use a multiline backtick string and function `trimAndJoin` from npm module
  `@admc.com/apputil` to trim each component line and join them without linebreaks.
- **Modules**: Prefer **ES Module** style (`import`/`export`). Use **CommonJS** (`require`) only
  when a third-party module does not support ESM.
- **Async**: Use `async/await` over raw Promises where possible.
- **Linting**: Honor `.eslintrc.json`, but prioritize code quality. Use inline comment directives
  to bypass rules where absolute conformity would make the code worse.
- **Formatting**: When breaking long chains, place line breaks AFTER the member-delimiting dots.
- **Brevity**: Use single-line conditionals with short bodies for brevity
  (e.g., `if (!res.ok) throw new Error("Fail");`). Avoid single-line code blocks unless part of a
  consistent series (omit the `{}` for single-line statements).
- **Logging**: Avoid `console.log`. Use specific logging **functions** to manage severity levels
  (e.g., `console.info`, `console.warn`, `console.error`).
- **Logic**: Avoid the idiosyncratic `booleanExpression && someFunction()` shortcut; use explicit
  conditionals.

## Bourne-style Shell Code Standards
- **Initialization**: Always start scripts with `set +u`, `set -o pipefail`, and
  `shopt -s xpg_echo`.
- **Dependency Checks**: Include a test block early for non-universally accessible executables:
```bash
for bin in x y z; do
    type -t $bin >/dev/null || Abort "$PROGNAME requires '$bin' in your search path"
done
```
- **Quoting**: Use single quotes for strings by default. Use double quotes only for interpolation
  (variables/expressions) or when the string contains a single quote.
- **Variables**: Use double quotes for variable references (e.g., `"$VARNAME"`) if they could be
  unset or contain whitespace, unless multiple-token expansion is explicitly required.
- **Logic**: Use the most succinct form for the context. Prefer
  `conditional && success_command` or `conditional && { ... }`. Use `&&` / `||` chains for
  `if/else` logic where precedence allows.
- **Brevity**: Place simple compounds on a single line if under 100 chars
  (e.g., `VAL=$(cmd) || Abort 'failed'`).
- **Conditionals**: Use either `[ ]` or `[[ ]]` based on which is supported by the shell and
  provides the cleanest syntax for the specific check.
- **Command stdin Blocks**: When the shell supports it, you don't need EOF prefix-stripping
  feature, and the stdin text block to be fed to a command doesn't itself contain the <<< quote
  character, use `<<<` per the following example, using `"` when you want variable and expression
  interpolations and `'` otherwise:
```bash
command <<< `A
code block containing no single-quote
where you do not want interpolation.`
```
