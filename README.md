# ESLint plugin for ServiceNow JavaScript scriptlets

## Motivation, Goals, and Concepts
ServiceNow supports many different scriptlet types that have drastically different linting
requirements.  All server and MID scripts are evaluated with ES5.  Only scripts have access to the
'gs' object.  Client scripts run on the SN-compliant ES6+ browsers and have access to 'g_form' and
other objects.  MID scripts have access MID SIs.  Client scripts have isolated and non-isolated
variants which determines accessibilty to 'window', jQuery, etc. al.  Besides that, ServiceNow
global scripts can use const statements despite being ES5.  ESLint OOTB can't handle these
complexities.

This plugin handles the global-object and rule variants by switching ESLint environments and rules
based on the ServiceNow table and an optional "altscope".  The provided config generator uses
altscopes in overrides/files entries, and you can add or customize with overrides/file entries in
your own "snlintrc.json" file.

The snLint snlint-wrapper script decouples eslint from filepaths on your system, passing
pseudo paths TO ESLint so you can use whatever directory structure you wish and specify the target
table and altscope (using -t and -a switches); and it transforms ES5 'const' statements to 'var' to
satisfy ESLint.

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
    snLint -g .
```
With local project installation
```
    npm exec snLint -- -s
    npm exec snLint -- -g .
```

## Usage
To get invocation syntax help:
```
    snLint -h                # with global installation
    npm exec snLint -- -h    # with local project installation
```

## Customization
See file "snglobals/README.txt" for instructions on how to customize the global JavaScript object
lists, to prevent ESLint from generating 'no-undef' violations, without having to code
eslint-disable directives.

The provided globals were generated from a fresh San Diego instance with default plugins plus
the Discovery plugin.

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
