"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listJenvAsdfFiles = exports.runJenvAsdf = void 0;
const fs_1 = require("fs");
const common_processing_1 = require("./common_processing");
const JAVA_VERSION_PATTERN = /^(java\s+)?(\d+(\.\d+)?)/mgi;
function runJenvAsdf(result, workDir, deep) {
    let files = listJenvAsdfFiles(workDir, deep);
    if (files.length > 0) {
        process(files, result);
    }
}
exports.runJenvAsdf = runJenvAsdf;
function listJenvAsdfFiles(workDir, deep) {
    return (0, common_processing_1.listFiles)(workDir, deep, '^(\.java.version|\.tool.versions)$', [], 0);
}
exports.listJenvAsdfFiles = listJenvAsdfFiles;
function process(jenvAsdfFiles, result) {
    var _a, _b;
    for (const file of jenvAsdfFiles) {
        try {
            const match = (_b = (_a = (0, fs_1.readFileSync)(file, "utf8")) === null || _a === void 0 ? void 0 : _a.trim()) === null || _b === void 0 ? void 0 : _b.match(JAVA_VERSION_PATTERN);
            if (match) {
                let propertyMap = new Map();
                propertyMap.set('java_version', match[match.length - 1].replace('java', '').trim());
                (0, common_processing_1.setCommonResults)(result, propertyMap);
            }
        }
        catch (err) {
            console.error(`Error reading file '${file}':`, err);
        }
    }
    return result;
}
