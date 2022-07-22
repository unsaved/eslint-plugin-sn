/**
 * Can run this as a bg script or in a fix script
 */

/* eslint-disable strict, prefer-template, no-var */
/* global GlideAggregate, gs */
const ga = new GlideAggregate("sys_script_include");
ga.addQuery("sys_scope.scope", "!=", "global");
ga.addQuery("access", "public");
ga.addQuery("active", true);  // Comment out statement to allow for enabling active==false's
ga.orderBy("sys_scope.scope");
ga._query();
const scopes = [];
while (ga._next()) scopes.push(ga.getValue("sys_scope.scope"));
gs.log(scopes.length + " scopes\n" + scopes.join("\n"), "siScopeList");
