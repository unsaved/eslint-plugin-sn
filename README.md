# ESLint plugin for ServiceNow JavaScript scriptlets

## Motivation, Goals, and Concepts
ServiceNow supports many different scriptlet types that have drastically different linting
requirements.  All server and MID scripts are evaluated with ES5, and only these scripts
scripts have access to the 'gs' object.
Client scripts run on the SN-compliant ES6+ browsers and have access to 'g_form' and
other objects.  MID scripts have access to MID SIs.  Client scripts have isolated and non-isolated
variants which determines accessibilty to 'window', jQuery, etc. al.  Besides that, ServiceNow
global scripts can use const statements despite being ES5.  ESLint OOTB can't handle these
complexities.

This plugin handles the global-object and rule variants by switching ESLint environments and rules
based on the ServiceNow table and an optional "altscope".  The provided config generator uses
'altscopes' in overrides/files entries, and you can add or customize with overrides/file entries in
your own "snlintrc.json" file, and you can add to the available global variable lists by adding
local list files.

The snLint snlint-wrapper script decouples eslint from filepaths on your system, passing
pseudo paths TO ESLint.  This allows you to
1. Code const statements in server and MID scripts.  We transform these ES5 'const' statements
   to var to satisfy ESLint.
1. Specify altscope with -a switch, such as 'scoped' vs. 'global' for ServiceNow app scope;
   or 'iso' vs. 'noniso' for Client Script isolation mode.
   (From script perspective app scope doesn't matter for client scripts).
1. Indicate target ServiceNow table (so we know which rules to apply) with -t switch, OR
1. If you do not specify -t (which overrides) then target table is determined by the directory
   name in which each script resides.

## Installation
To install globally (accessible to all npm projects):
```
    npm i -g @admc.com/eslint-plugin-sn
```
UNIX users will need root privileges, so run this as root or under sudo.

To use just with your own project, install locally:
```
    npm i @admc.com/eslint-plugin-sn
```

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
target tables, and altscopes.

## Customization
See file "snglobals/README.txt" for instructions on how to customize the global JavaScript object
lists, to prevent ESLint from generating 'no-undef' violations, without having to code
eslint-disable directives.

The provided globals were generated from a fresh San Diego instance with default plugins plus
the Discovery plugin.

To support a new target table and/or scopealt, add new override elements to your 'sneslitrc.json'
file, with your files values including the table and scopealt.
To mark the new table/altscope as supported, you must add the following special rule to one
overrides element.
```
    "@admc.com/sn/invalid-table-altscope": "off"
```

Our globals list for intra-scoped-SI accesses is purposefully over-liberal.
There is no difficulty restricting intra-scope access (including to or from global) because the
references must always start with a scope name, and we already have all SI scopes in our list.
We handle global-to-global SI accesses by providing a complete list of global SIs.
But for non-global intra-scope accesses we only check that any scope has the SI name defined.
To restrict accurately we would have to maintain a separate list for every non-global scope, and
that's just not practical.
If you want to narrow down intra-scope SI accesses for specific scopes, you're welcome to define
new altscopes for this purpose, defining "sneslintrc.json" environments, override elements.
If you only edit scripts in one or a few scopes, then a much easier customizaton procedure is
documented in the "snglobals/README.txt" file, to replace the list of all scopedSIs with just those
that you should be accessing.

## Supported ServiceNow scriptlet types
### Supported Now
Alphabetically
|Table                        |Altscopes alternatives
|---                          |---
|catalog_script_client        |iso, noniso
|ecc_agent_script             |(can't specify any altscope)
|ecc_agent_script_include     |(can't specify any altscope)
|expert_script_client         |iso, noniso
|sa_pattern_prepost_script    |global, scoped
|sc_cat_item_producer         |global, scoped
|sysauto_script               |global, scoped
|sysevent_script_action       |global, scoped
|sys_processor                |global, scoped
|sys_script                   |global, scoped
|sys_script_client            |iso, noniso
|sys_script_email             |global, scoped
|sys_script_fix               |global, scoped
|sys_script_include           |global, scoped
|sys_security_acl             |global, scoped
|sys_transform_map            |global, scoped
|sys_transform_script         |global, scoped
|sys_web_service              |global, scoped
|sys_ws_operation             |global, scoped
|sys_ui_action                |global, scoped, iso, noniso, iso_globalaction, noniso_globalaction, iso_scopedaction, noniso_scopedaction
|sys_ui_policy.script_true    |iso, noniso
|sys_ui_policy.script_false   |iso, noniso

The 8 altscope variants for the sys_ui_action script are necessary to support the different JavaScript requirements depending on combination of settings:  Action name, Isolate script, Client

### Planned
In very rough order of priority
|Table                        |Altscopes alternatives
|---                          |---
|sys_ui_script                |TBD
|custom fields                |TBD
|sp_widget.script             |global, scoped
|sp_widget.client_script      |TBD
|sys_cb_topic                 |TBD
|sa_pattern                   |probably none
|mid_limited_resource_script  |none

## Development
Though you can test the individual rules from this project, due to eslint-plugin system design,
you can't test usage of the plugin from here.  To test the plugin you need to be outside of this
project and load this plugin.  Since this module's 'snLint.js' loads this plugin, it also can't
be tested from here.  This is the reason for existence of peer module
@admc.com/eslintplugin-sn-test.

