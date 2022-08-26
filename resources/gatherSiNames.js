/**
 * Can run this as a bg script or in a fix script
 */

/* eslint-disable strict, prefer-template, no-var */
/* global GlideAggregate, gs */
const gatherScoped = false;  // TODO:  Set this to true to gather scoped; to false for global
var n;
const ga = new GlideAggregate("sys_script_include");
ga.addQuery("sys_scope.scope", gatherScoped ? "!=" : "=", "global");
ga.addQuery("active", true);  // Comment out statement to allow for enabling active==false's
ga.orderBy("name");
ga._query();
const names = [];
while (ga._next()) { n = ga.getValue("name"); if (/^[_a-zA-Z]\w*$/.test(n)) names.push(n); }
gs.log(names.length + " " + (gatherScoped ? "scoped" : "global")
  + " names\n" + names.join("\n"), "siNameList");
