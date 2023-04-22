"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBadges = void 0;
const fs_1 = require("fs");
const common_processing_1 = require("./common_processing");
const brightgreen = '4c1';
const green = '97CA00';
const yellowgreen = 'a4a61d';
const yellow = 'dfb317';
const orange = 'fe7d37';
const red = 'e05d44';
const blue = '007EC6';
const grey = '555';
const lightgrey = '9f9f9f';
const pink = 'ffc0cb';
const purple = '9370db';
const SHIELD_COLORS = new Map([
    ['project_encoding', green],
    ['builder_name', green],
    ['builder_name', green],
    ['builder_version', orange],
    ['is_gradle', green],
    ['is_maven', green],
    ['builder_name', green],
    ['artifact_name', orange],
    ['artifact_name_jar', orange],
]);
const REGEX_BADGE_GENERIC = /!\[c_(.*?)]\s*\(.*\/badge\/(.*?)(\?.*?)?\)/mg;
function setColor(key, val, color) {
    if (key.startsWith('is_')) {
        if (val === 'true') {
            color = green;
        }
        else if (val === 'false') {
            color = red;
        }
    }
    else if (key.endsWith('_version')) {
        if (val.startsWith("0") || val.startsWith("v0") || val.startsWith("v0") || val.includes("+") || val.includes("rc")) {
            color = orange;
        }
        else {
            color = green;
        }
    }
    else if (key == 'java_version' || key == 'java_version_legacy') {
        let version = (0, common_processing_1.int)(val);
        if (version < 8) {
            color = red;
        }
        else if (version < 17) {
            color = orange;
        }
        else if (version >= 17) {
            color = green;
        }
    }
    return color;
}
function updateBadges(result, workDir, deep) {
    (0, common_processing_1.listFiles)(workDir, deep, '.*\\.(md|markdown|mdown|mkd|mdwn|mdtext|mdtxt)', [], 0).forEach(file => {
        const fileContentOrg = (0, fs_1.readFileSync)(file, 'utf-8');
        let content = (0, common_processing_1.str)(fileContentOrg);
        content = content.replace(REGEX_BADGE_GENERIC, (match, key, link) => {
            // Get the value from the result map based on the captured key
            return updateLink(file, key, clearKeyOrValue((0, common_processing_1.str)(result.get(key))), match, (0, common_processing_1.str)(link));
        });
        // Write the updated content back to the file
        if (content !== fileContentOrg) {
            (0, fs_1.writeFileSync)(file, content, 'utf-8');
        }
    });
}
exports.updateBadges = updateBadges;
function updateLink(file, key, value, match, link) {
    let color;
    if ((0, common_processing_1.isEmpty)(value)) {
        value = 'not_available';
        color = red;
        console.warn(`Badges/Shields Updater: key [${key}] does not match any output variable. File [${file}]`);
    }
    else {
        color = SHIELD_COLORS.get(key) || orange;
        color = setColor(key, value, (0, common_processing_1.isEmpty)(color) ? orange : color);
    }
    //format key
    key = clearKeyOrValue(key);
    // Replace the link with the new value
    if (match.toLowerCase().includes('shields.io')) {
        return match.replace(link, `${key}-${value}-${color}`);
    }
    else if (match.toLowerCase().includes('badgen.net')) {
        return match.replace(link, `${key}/${value}/${color}`);
    }
    return match;
}
function clearKeyOrValue(keyOrValue) {
    return (keyOrValue.toLowerCase().startsWith('x_') ? keyOrValue.substring(2) : keyOrValue).trim().replace(/[^a-zA-Z0-9\\.]/g, '_').replace('__', '_').replace('._', '.');
}
