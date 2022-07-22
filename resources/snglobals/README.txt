All the files in this directory are JavaScript global-level objects that
scripts are allowed to reference.  We do not mean ServiceNow non-app-scope.
The word "global" in the file name "globalSI.txt", however, does mean
JavaScript global-level objects that are ServiceNow global scope objects.

FOR YOU TO DO:
The provided lists contain the OOTB ServiceNow global objects as well as I have
been able to find them, and without spending my entire life on this.
To add to these lists for objects for optional plugins or for objects added by
your organization, use the following procedure.

Make new files of same name as existing files here, but insert "-local" before
the ".txt" suffix.  For example to add SI scope global objects, make a new
file named "SIScopes-local.txt".

You can make the text global lists using any method you want.
It makes it much easier and more reliable if you run server scripts using 
bg or fix scripts that generate lists, then use a minus/subtract shell script
(or 'diff') to generate the delta that you need in your *local* files.
(Email me if you'd like my Bash 'minus' script).
To generate your local super-list (i.e. before subtraction of OOTB entries),
most often you can use the Service Now query builder of table_name.list or
/table_name_list.do URL, customize the columns-to-display down to just the  API
or scope that you need, do a CSV export of it.  The ServiceNow API does not
facilitate export of groupings, so for more complicated cases like all used
sys_scopes used by the records, use a server script like those provided at
"/resources/gather*.js".

For accessing scoped SIs you will need to add entries to your local
"sneslintrc.json" file.  Consider defining your own "altscope".  In
"sneslintrc.json" you would create an environment with the list of globals of your
altscope SIs, update existing server overrides.files entries (depending whether
your scripts have access of public vs. package_private), and add a new overrides
object for intra-scope access.
After that you would use your new altscope with snLint -a switch.

If you only work with one or a few scopes, then a perfect and easy customization
is to just empty the "scopedSIs.txt" file (leave it there empty or with a
comment) and add a "scopedSIs-local.txt" file.  The allowed intra-scope SI
accesses will then be only what you have in your "scopedSIs-local.txt" file.

The files "snglobals/tableSpecifics*.json" are different from the rest in that
the are not simple text files that allow global to broad groups of
tables/scopes, but specify in JSON format global variables of required IIFE
parameters for individual tables.  See the provided
"snglobals/tableSpecifics.json" for examples of how to specify.
A limitation that greatly reduces end-user control is that "exports.js" must
have an overrides files entry with pseudo-path matching just the file, in order
for tableSpecifics settings to load.  With release of module 2.x.y this
limitation will be eliminated.
