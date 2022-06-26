# Description
ESLint plugin for ServiceNow JavaScript scriptlets

Once you add this plugin as "@admc.com/sn" to your config (most often in a .eslintrc.json file),
you can then add env "@admc.com/sn/servicenow".

Also provides script "snLint" which works like the "eslint" command, except that in addition to
source code script(s) you also need to specify the ServiceNow table (and optionally app scope).


# Installation
```
    npm i @admc.com/sn
```
