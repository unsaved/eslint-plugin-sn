"use strict";
/* eslint-disable */

/**
 * Run this in global scope or an app scope to get a report on which objects in the SN API Spec
 * are in reality available in that scope.  Like much SN documentation, this reference is not
 * reliable, hence the validation done here.
 * Since 'eval' statement is prohibited in scope context, you need to have some writable table
 * field of type String with adequate max length for our commands (60 is long enough for the
 * scripting around all object names now-- for future safety allow for longer.  If creating a
 * new field, just set it to 256 and be done with it).  WE DO NOT UPDATE THIS (or any) TABLE.
 *
 * N.b. execution writes a bunch of Evaluator messages and stack traces for the expeced acces
 * failures.  Just ignore them and attend to the result report at the end.
 */
(function() {
const isGlobal = gs.getCurrentScopeName() === "rhino.global";
var eMsg;
// TODO:  Update to use table field writable from global and from your test scope.
//        (Though we will in fact not write it).
const GLOBAL_EVAL_TABLE = "u_wide_open";
const GLOBAL_EVAL_FIELD = "u_data";
const SCOPED_EVAL_TABLE = "sn_bm_client_wide_open";
const SCOPED_EVAL_FIELD = "u_data";

// These variables are named according to pre-sumed variable type.
// The results of your execution will tell you what their scope is empirically.
// S: Scoped vs. G: Global
const accessibleSFns = [], inaccessibleSFns = [], accessibleSNss = [], inaccessibleSNss = [];
const accessibleGFns = [], inaccessibleGFns = [], accessibleGNss = [], inaccessibleGNss = [];

const apiScopedFunctions = [
  "action",
  "CertificateEncryption",
  "FlowScriptAPI",
  "GlideAggregate",
  "GlideApplicationProperty",
  "GlideCalendarDateTime",
  "GlideDate",
  "GlideDateTime",
  "GlideDBFunctionBuilder",
  "GlideDigest",
  "GlideDuration",
  "GlideElement",
  "GlideElementCurrency2",
  "GlideElementDescriptor",
  "GlideEmailOutbound",
  "GlideFilter",
  "GlideFormScratchpad",
  "GlideImportLog",
  "GlideImportSetRun",
  "GlideImportSetTransformer",
  "GlideLocale",
  "GlidePluginManager",
  "GlideQuery",
  "GlideQueryCondition",
  "GlideRecord",
  "GlideSchedule",
  "GlideScopedEvaluator",
  "GlideScriptableInputStream",
  "GlideScriptedProcessor",
  "GlideSecureRandomUtil",
  "GlideSecurityUtils",
  "GlideServletRequest",
  "GlideServletResponse",
  "GlideSession",
  "GlideSPScriptable",
  "GlideStringUtil",
  "GlideSysAttachment",
  "GlideSysListControl",
  "GlideSystem",
  "GlideTableHierarchy",
  "GlideTextReader",
  "GlideTime",
  "GlideTransformLog",
  "GlideUICompatibility",
  "GlideURI",
  "GlideUser",
  "GlideXMLUtil",
  "NotifyConferenceUtil",
  "Optional",
  "PAScorecard",
  "PASnapshot",
  "RenderProperties",
  "ScopedDCManager",
  "SPScriptedFacet",
  "SPScriptedFacetService",
  "Stream",
  "TemplatePrinter",
  "v_query",
  "v_table",
  "Workflow",
  "XMLDocument2",
  "XMLNode",
  "XMLNodeIterator",
];
const apiScopedNameSpaces = [
  "JSON",
  "sn_agent",
  "sn_ais",
  "sn_auth",
  "sn_cc",
  "sn_clotho",
  "sn_cmdb",
  "sn_cmdbgroup",
  "sn_connect",
  "sn_cs",
  "sn_cti_core",
  "sn_currency",
  "sn_devops",
  "sn_discovery",
  "sn_doc_services",
  "sn_dt",
  "sn_dt_api",
  "sn_fd",
  "sn_hr_core",
  "sn_hr_le",
  "sn_hw",
  "sn_ih",
  "sn_ih_kafka",
  "sn_impex",
  "sn_instance_scan",
  "sn_interaction",
  "sn_kmf_ns",
  "sn_nlp_sentiment",
  "sn_notification",
  "sn_notify",
  "sn_pad",
  "sn_pdfgeneratorutils",
  "sn_playbook",
  "sn_sc",
  "sn_skill_rule",
  "sn_sms_pref",
  "sn_templated_snip",
  "sn_tfrm",
  "sn_uc",
  "sn_ui",
  "sn_uni_req",
  "sn_uni_task",
  "sn_ws",
];

try {
    const gr = new GlideRecord(isGlobal ? GLOBAL_EVAL_TABLE : SCOPED_EVAL_TABLE);
    if (!gr.get("sys_mod_count", 0))
        throw new Error("Fetch failed.  Fashion some get that can fetch one row");
    const gse = new GlideScopedEvaluator();

    apiScopedFunctions.sort();
    apiScopedNameSpaces.sort();

    apiScopedFunctions.forEach(function(fn) {
        try {
            gr.setValue("u_data", fn + "; typeof(" + fn + ");");
            const type = gse.evaluateScript(gr,
              isGlobal ? GLOBAL_EVAL_FIELD : GLOBAL_EVAL_FIELD, null);
            if (type === "function") accessibleSFns.push(fn);
            else throw new Error("Unexpected type for API scoped fn '" + fn + "': " + type);
        } catch (e0) {
            inaccessibleSFns.push(fn);
        }
    });
    apiScopedNameSpaces.forEach(function(fn) {
        try {
            gr.setValue("u_data", fn + "; typeof(" + fn + ");");
            const type = gse.evaluateScript(gr,
              isGlobal ? GLOBAL_EVALFIELD : SCOPED_EVAL_FIELD, null);
            if (type === "object") accessibleSNss.push(fn);
            else throw new Error("Unexpected type for API scoped NS '" + fn + "': " + type);
        } catch (e0) {
            inaccessibleSNss.push(fn);
        }
    });
//accessibleSFns = [], inaccessibleSFns = [], accessibleSNss = [], inaccessibleSNss = [];
//accessibleGFns = [], inaccessibleGFns = [], accessibleGNss = [], inaccessibleGNss = [];

} catch(e) {
    if (typeof e === "object" && e !== null && "message" in e) try {
        if (e.message) eMsg = String(e.message);
    } catch (eNest) { } // Intentionally empty
    if (isGlobal)
        gs.logError((eMsg === undefined) ? String(e) : eMsg, "globalAccessChecker");
    else
        gs.error("globalAccessChecker: " + ((eMsg === undefined) ? String(e) : eMsg));
} finally {
    const report = "FNs: " + accessibleSFns.length + " accessible  + " + inaccessibleSFns.length +
      ": " + inaccessibleSFns +
      "\nNSs: " + accessibleSNss.length + " accessible + " + inaccessibleSNss.length + " " +
      inaccessibleSNss;
    if (isGlobal)
        gs.log(report, "globalAccessChecker");
    else
        gs.info("globalAccessChecker: " + report);
}

})();
