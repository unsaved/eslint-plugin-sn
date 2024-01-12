ServiceNow has several very poor sys_script_validator records which will prevent you from
using modern JavaScript constructs from web editor, for .condition fields and fields of
types 'Script' and 'Script (Plain)'.
This directory contains suggested sys_script_validator replacement
scriptlets.

Also I recommend that you deactivate the record for type 'Condition String'.

Type 'Script' and type 'Script (Plain)' do not vary at all, but there are script changes
  for different ui_types.  Therefore I'm providing just "desktop-validator.js" and
  "mobile-validator.js" files.  Copy these into the corresponding records for both
  internal_type=='Script' and internal_type=='Script (Plain)'.
