# ESLint plugin for ServiceNow JavaScript scriptlets
<!-- The source for this document is at "doc/README.md" in the project.
     File "/README.md" at the root level is generated from it using an npm script. -->

<!-- toc -->

- [Motivation, Goals, and Concepts](#motivation-goals-and-concepts)
- [Installation](#installation)
- [Setup](#setup)
- [Usage](#usage)
  * [Color Output Work-around](#color-output-work-around)
- [Customization](#customization)
- [Supported ServiceNow scriptlet types](#supported-servicenow-scriptlet-types)
  * [Supported Now](#supported-now)
  * [Planned](#planned)
- [Development](#development)
- [Provided Rules](#provided-rules)

<!-- tocstop -->

## Motivation, Goals, and Concepts
ServiceNow supports many different scriptlet types that have drastically different linting
requirements.  All server and MID scripts are evaluated with ES5, and only these scripts
scripts have access to the 'gs' object.
Client scripts run on the SN-compliant ES6+ browsers and have access to 'g_form' and
other objects.  MID scripts have access to MID SIs.  Client scripts have isolated and non-isolated
variants which determines accessibilty to 'window', jQuery, et. al.  Besides that, ServiceNow
global scripts can use const statements despite being ES5.
ESLint OOTB can't handle these complexities.

This plugin handles the global-object and rule variants by switching ESLint environments and rules
based on the ServiceNow table and usually an _alt_.
"alt" is our term for distinguishing between _alt_-ernate JavaScript environments for the same
scriptlet field.
For example, linting of field sys_script.script must specify alt of either ``global`` or
``scoped-es5``;
and linting of field sys_script_client.script must specify alt of either ``iso`` or ``noniso``.

From version 3.1.5 if you end logical file names with ``-condition.js`` then the specified scope
is altered to accommodate the server-side condition scriptlet.  This has not been tested
comprehensively yet.

The provided config generator uses alts in overrides/files entries, and you can add or
customize with overrides/file entries in your own "sneslintrc.json" file.
Our design leverages ESLint override/files entries.
Normally ESLint override/files entries are matched against input file paths.
We instead use this switching to provide the needed ServiceNow capability toggling by internally
generating pseudopaths which always contain the targeted ServiceNow table and an alt.
You can see the mappings between pseudo paths and ServiceNow script capabilities in file
"exports.js".
You can override or add your own mappings of pseudo paths with an "sneslintrc.json" file.

You can also add to the available global variable lists by adding local list files.
See the customize section below for details.

The snLint snlint-wrapper script decouples eslint from filepaths on your system, passing
pseudo paths TO ESLint.  This allows you to
1. Code const statements in server and MID scripts.  We transform these ES5 'const' statements
   to 'var' to satisfy ESLint.
1. Specify _alt_ with -a switch, such as 'scoped' vs. 'global' for ServiceNow app scope;
   or 'iso' vs. 'noniso' for Client Script isolation mode.
   (From scripting perspective app scope doesn't matter for client scripts).
   Each table has a default alt value, so the switch is optional.
   (Consequently, for cases where table has only one alt value, the -a switch adds no benefit).
1. Indicate target ServiceNow table (so we know which rules to apply) with -t switch, OR
1. If you do not specify -t (which overrides) then target table is determined by the directory
   name in which each script resides.

Related module @admc.com/sn-developer provides other conveniences for ServiceNow developers,
including TinyMCE ESLint configurations and a system to do scriptlet development on your workstation
rather than using the web editor (TinyMCE).

## Installation
To install globally (accessible to all npm projects):
```
    npm i -g @admc.com/eslint-plugin-sn
```
UNIX users will need root privileges, so run this as root or under sudo.

To use just with your own project, install locally:
```
    npm init -y  # If a ``./package.json`` or ``./node_modules/`` is not already present
    npm i @admc.com/eslint-plugin-sn
```
(Without a ``./package.json`` or ``./node_modules/`` present, npm may install the package to
another cascade directory).

## Setup
With global installation
```
    snLint -s
    snLint -g
```
With local project installation
```
    npm exec snLint -- -s
    npm exec snLint -- -g
```

## Usage
To get invocation syntax help:
```
    snLint -h                # with global installation
    npm exec snLint -- -h    # with local project installation
```
Do read the brief output from this command for essential information about specifying files,
target tables, and alts.  The switch list in the output provides a concise list of the many
features.

### Color Output Work-around
As a work-around for a mingw or git-for-windows glitch, if Node.js can't determine tty interactivity
correctly, then you can export env node variable FORCE_COLOR to true.
You can check your system with
```
    node -p process.stdout.isTTY
```

## Customization
See file "snglobals/README.txt" for instructions on how to customize the global JavaScript object
lists, to prevent ESLint from generating 'no-undef' violations, without having to code
eslint-disable directives.

The provided globals were generated from a fresh San Diego instance with default plugins plus
the Discovery plugin.

To support a new target table and/or alt, add new override elements to your 'sneslitrc.json'
file, with your files values including the table and (optional) alt.

You need to also add a ``customTables`` element to "sneslintrc.json".
The value is a mapping from new table name to the list of supported alt names, with the default alt name first.
If you are modifying an out-of-the-box table (adding or removing alts),
  just specify the new alt list and it will override.

Our globals list for intra-scoped-SI accesses is purposefully over-liberal.
There is no difficulty restricting intra-scope access (including to or from global) because the
references must always start with a scope name, and we already have all SI scopes in our list.
We handle global-to-global SI accesses by providing a complete list of global SIs.
But for non-global intra-scope accesses we only check that any scope has the SI name defined.
To restrict accurately we would have to maintain a separate list for every non-global scope, and
that's just not practical.
If you want to narrow down intra-scope SI accesses for specific scopes, you're welcome to define
new alts for this purpose, defining "sneslintrc.json" environments, override elements.
If you only edit scripts in one or a few scopes, then a much easier customizaton procedure is
documented in the "snglobals/README.txt" file, to replace the list of all scopedSIs with just those
that you should be accessing.

## Supported ServiceNow scriptlet types
### Supported Now
Alphabetically
|Table                          |Alts (default bolded)
|---                            |---
|catalog_script_client          |**iso**, noniso
|catalog_ui_policy.script_true  |**iso**, noniso
|catalog_ui_policy.script_false |**iso**, noniso
|ecc_agent_script               |**all**
|ecc_agent_script_include       |**all**
|expert_script_client           |**iso**, noniso
|sa_pattern                     |**all**
|sa_pattern_prepost_script      |**global**, scoped-es5[^1], scoped-es12[^m]
|sc_cat_item_producer           |**global**, scoped-es5[^1], scoped-es12[^m]
|sp_widget.script               |**global**, scoped-es5[^1], scoped-es12[^m]
|sp_widget.client_script        |**all**
|sysauto_script                 |**global**, scoped-es5[^1], scoped-es12[^m]
|sysevent_script_action         |**global**, scoped-es5[^1], scoped-es12[^m]
|sys_processor                  |**global**, scoped-es5[^1], scoped-es12[^m]
|sys_script                     |**global**, scoped-es5[^1], scoped-es12[^m]
|sys_script_client              |**iso**, noniso
|sys_script_email               |**global**, scoped-es5[^1], scoped-es12[^m]
|sys_script_fix                 |**global**, scoped-es5[^1], scoped-es12[^m]
|sys_script_include             |**global**, scoped-es5[^1], scoped-es12[^m]
|sys_script_validator           |**all**
|sys_security_acl               |**global**, scoped-es5[^1], scoped-es12[^m]
|sys_transform_entry            |**global**, scoped-es5[^1], scoped-es12[^m]
|sys_transform_map              |**global**, scoped-es5[^1], scoped-es12[^m]
|sys_transform_script           |**global**, scoped-es5[^1], scoped-es12[^m]
|sys_web_service                |**global**, scoped-es5[^1], scoped-es12[^m]
|sys_ws_operation               |**global**, scoped-es5[^1], scoped-es12[^m]
|sys_ui_action                  |[^1] **global**, scoped-es5, iso, noniso, iso_global, noniso_global, iso_scoped-es5, noniso_scoped-es5, iso_scoped-es12[^m], noniso_scoped-es12[^m]
|sys_ui_page.client_script      |**all**
|sys_ui_page.processing_script  |**global**, scoped-es5[^1]
|sys_ui_policy.script_true      |**iso**, noniso
|sys_ui_policy.script_false     |**iso**, noniso
|sys_ui_script                  |**all**

[^1]: The listed altscope constants are for version series 3.
     For versions 2.*.* use ``scoped`` instead of ``scoped-es5``; and use these variants in place
     of the sys_ui_action \_\*\_ contants:  ``iso_globalaction``, ``noniso_globalaction``,
     ``iso_scopedaction``, ``noniso_scopedaction``.
[^m]: Alt scopes *scoped-es12* were added with version series 3.1.

The 8 alt variants for the sys_ui_action script are necessary to support the different JavaScript requirements depending on combination of settings:  Action name, Isolate script, Client.

### Planned
In very rough order of priority
|Table                        |Alts
|---                          |---
|custom fields                |TBD
|sys_cb_topic                 |TBD
|mid_limited_resource_script  |**all**
|sc_cat_item_composer_producer|**global**, scoped-es5
|sp_header_footer             |**all**

## Development
Though you can test the individual rules from this project, due to eslint-plugin system design,
you can't test usage of the plugin from here.  To test the plugin you need to be outside of this
project and load this plugin.  Since this module's 'snLint.js' loads this plugin, it also can't
be tested from here.  This is the reason for existence of peer module
@admc.com/eslintplugin-sn-test.

## Provided Rules
Rules in the @admc.com/sn/ namespace.
Rules can be reconfigured to apply where you say.
The table shows by default what scopes they are applied to and at what level.
Note that scriptlet scope of "server" does not include MID scriptlets.
|Rule                        |Level  |Sciptlet Scope   |Description/justification
|---                         |---    |---              |---
|immediate-iife              |error  |all              |IIFEs must execute immediately
|invalid-table-alt           |error  |Unsupported      |Invalid table/alt combination
|legacy-use-this             |error  |all              |Same as OOTB ESLint rule [class-methods-use-this](https://eslint.org/docs/latest/rules/class-methods-use-this) but for pre-ES6
|log-global-2-args           |error  |server global    |ServiceNow global logging statements should specify source with 2nd parameter
|log-scoped-varargs          |error  |server scoped*   |ServiceNow scoped logging statements should only have more than one param if using varargs
|no-boilerplate              |error  |all              |ServiceNow-provided boilerplate comments should be removed when scripts are implemented
|no-br-current-update        |error  |sys_script       |current.update should usually not be executed in BR scripts
|no-client-gr                |warn   |client           |Other tactics should be favored as more efficient than client-side GlideRecord
|no-console-info             |error  |client           |Level-specific console logging statements are better because console.info default filtering is inconsistent
|no-gs-now                   |error  |client           |gs.now() function is unsupported since London release
|no-init-emptystring         |warn   |all              |For rare cases where the value is to really be used as a string (not just tested) this is ok.  Normally the system default of undefined works great.
|no-log-global               |error  |server scoped*   |Scoped app scripts should use the scoped logging API
|no-log-scoped               |error  |server global    |Global scope scripts should use the global logging API
|no-sysid                    |error, warn[^2]|server, client|In almost all cases it is easy and efficient to use an informative value rather than inscrutible codes that can't be visually reviewed for correctness.  This actually matches for all 32 character hex strings, so you will need to disable for valid non-sysid strings such as MD5 checksums.
|no-uiscript-curlref         |warn   |sys_ui_scripts   |References like ${this} get clobbered by the platform, at least if you load the UI script via \*.jsdbx file.
|no-useless-rtrn             |error  |all              |Assigning to 'rtrn' has no effect other than polluting the namespace, and is misleading
|prefer-array-iterator       |warn   |all              |Native JavaScript iterators avoid tricky pre-ES6 variable scoping issues
|sn-workaround-iife          |error  |some server[^3]|Due to poor ServiceNow design, several script types require IIFE wrapping if the script body assigns to any variables without an intervening function
|validate-gliderecord-calls  |error, warn[^2]|server, client|GlideRecord functions insert, update, get, next, deleteRecord all provide return values that you should check

[^2]: no-sysid and validate-gliderecord-calls rules default to error level for server-side scriptlets and warn level for
[^3]: The sn-workaround-iife rule is applied to some specific server tables
client-side scriptlets

