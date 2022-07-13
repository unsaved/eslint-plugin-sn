#!/usr/bin/env node

"use strict";

const fs = require("fs");
const args = process.argv.slice(2);
let head, foot, errCount, warnCount;
const rows = [];

if (args.length < 1) throw new Error("SYNTAX:  node mergeEslintHtml.js file1.html file2.html...");

args.forEach((f, i) => {
    const ex = /^([\s\S]+?)(<tr[\s\S]+<[/]tr>)([\s\S]+)$/.exec(fs.readFileSync(f, "utf8"));
    if (!ex) throw new Error(`Malformatted input file: ${f}`);
    if (!head) {
        // eslint-disable-next-line no-template-curly-in-string
        head = ex[1].replace(/<span>.+?<[/]span>.+/, "<span>${PROBRPT}</span> - ${GENRPT}");
        foot = ex[3];
        errCount = warnCount = 0;
    }
    const errEx = /<span>.+?[(].*?(\d+) errors.*?[)]<[/]span>/.exec(ex[1]);
    const warnEx = /<span>.+?[(].*?(\d+) warnings.*?[)]<[/]span>/.exec(ex[1]);
    if (errEx) errCount += parseInt(errEx[1]);
    if (warnEx) warnCount += parseInt(warnEx[1]);
    rows.push(ex[2].replace(/\bdata-group="f-0"/g, `data-group="f-${i}"`).
      replace(/\bclass="f-0"/g, `class="f-${i}"`));
});

process.stdout.write(head.
  /* eslint-disable no-template-curly-in-string */
  replace("${PROBRPT}", `${errCount} errors + ${warnCount} warnings = ${errCount+warnCount}`).
  replace("${GENRPT}", `Generated ${new Date}`) + rows.join("\n\n") + foot);
  /* eslint-ensable no-template-curly-in-string */
