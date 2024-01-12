function validate(value, fieldName) {
    /* eslint-disable prefer-arrow-callback, prefer-template */
    "use strict";
    if (!NOW.sp) return true;

    const validator = function(callback) {
        if (!value) {
            callback(fieldName, true);
            return;
        }

        // disable validation for certain tables
        /* Blaine fixes:
        var tableName = g_form.getTableName();
        if (tableName === 'sys_ui_script' || tableName === 'sys_script_client' || tableName === 'sys_script_validator') {
            callback(fieldName, true);
            return;
        }*/
        // disable validation for certain tables
        switch (g_form.getTableName()) {
            case "sys_script_client":
            case "catalog_script_client":
            case "expert_script_client":
            case "sys_ui_action":
            case "sys_ui_policy":
            case "sys_ui_script":
            case "sys_script_validator":
                callback(fieldName, true);
                return;
        }

        const ajax = new GlideAjax('JSValidator');
        const scope = g_form.getValue('sys_scope');
        ajax.addParam('sysparm_name', 'validate');
        ajax.addParam('sysparm_js_expression', value);
        ajax.addParam('sysparm_scope', scope);
        ajax.getXMLAnswer(function(answer) {
            if (answer === null) {
                callback(fieldName, true);
            } else {
                getMessage('Could not save record because of a compile error', function(trnsErrMsg) {
                    callback(fieldName, false, trnsErrMsg + ': ' + answer);
                });
            }
        });
    };

    return g_ui_scripts['sp.validation.executor']().
      execute(fieldName, validator, g_validation_script_field_count, g_form, NOW);
}
