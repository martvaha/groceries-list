"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
exports.__esModule = true;
var admin = require("firebase-admin");
admin.initializeApp();
__export(require("./share"));
