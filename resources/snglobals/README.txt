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

For accessing scoped SIs you will need to add entries to your local
"sneslintrc.json" file.  Consider defining your own "altscope".  In
"sneslintrc.json" you would create an environment with the list of globals of your
altscope SIs, update existing server overrides.files entries (depending whether
your scripts have access of public vs. package_private), and add a new overrides
object for intra-scope access.
After that you would use youⅹ new altscope with snLint -a switch.

If you only work with one or a few scopes, then a perfect and easy customization
is to just empty the "scopedSIs.txt" file (leave it there empty or with a
comment) and add a "scopedSIs-local.txt" file.  The allowed intra-scope SI
accesses will then be only what you have in youour "scopedSIs-local.txt" file.
