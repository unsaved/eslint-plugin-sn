function validate(value) {
    /* eslint-disable prefer-template */
    "use strict";
    /* eslint-disable prefer-arrow-callback, prefer-template */
    /* Blaine fixes this:
    if (g_form.getTableName() === 'sys_ui_script' || g_form.getTableName() === 'sys_script_client')
        return true; */
    switch (g_form.getTableName()) {
        case "sys_ui_action":
        case "sp_widget":
        case "sys_ux_data_broker_scriptlet":
        case "sys_ux_data_broker_transform":
            return true;
    }

    const ajax = new GlideAjax('JSValidator');
    const scope = g_form.getValue('sys_scope');
    ajax.addParam('sysparm_name', 'validate');
    ajax.addParam('sysparm_js_expression', value);
    ajax.addParam('sysparm_scope', scope);
    ajax.getXMLWait();
    const answer = ajax.getAnswer();
    if (answer === null) return true;
    return getMessage("Could not save record because of a compile error: " + answer);
}
