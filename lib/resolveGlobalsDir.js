const fs = require("fs");
const path = require("path");
const { AppErr } = require("@admc.com/apputil");

let prevIno, stat, possible, globalsDir;
let d = ".";
let i = 0;
while ((stat = fs.statSync(d)).isDirectory()) {
    if (stat.ino === prevIno) break;
    prevIno = stat.ino;
    if (++i > 1000) throw new Error("Assertion failed.  Loop detected");
    possible = path.join(d, "snglobals");
    if (fs.existsSync(possible) && fs.statSync(possible).isDirectory()) {
        globalsDir = possible;
        break;
    }
    d += "/..";
}
if (globalsDir === undefined) {
    possible = path.join(require("os").homedir(), "snglobals");
    if (fs.existsSync(possible) && fs.statSync(possible).isDirectory()) globalsDir = possible;
}
if (globalsDir === undefined) throw new AppErr(
  "Didn't find any 'snglobals' directory in any ancestor directory or home directory.\n"
  + "Use snLint -p switch to create and populate one.");

module.exports = globalsDir;
