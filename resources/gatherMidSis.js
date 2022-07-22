/**
 * Can run this as a bg script or in a fix script
 */

/* eslint-disable strict, prefer-template, no-var */
/* global GlideAggregate, gs */
const ga = new GlideAggregate("ecc_agent_script_include");
var n;
ga.addQuery("active", true);  // Comment out statement to allow for enabling active==false's
ga.orderBy("name");
ga._query();
const names = [];
while (ga._next()) { n = ga.getValue("name"); if (/^[_a-zA-Z]\w*$/.test(n)) names.push(n); }
gs.log(names.length + " names\n" + names.join("\n"), "midSiList");
