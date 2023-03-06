"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const process_maven_1 = require("./process_maven");
const process_gradle_1 = require("./process_gradle");
const core = require('@actions/core');
const fs = require('fs');
try {
    //TODO: read custom properties by 'custom_XY' with getValue
    //TODO: auto update java & gradle versions
    let workDir = core.getInput('work-dir');
    let jvFallback = core.getInput('jv-fallback') || 17;
    let pvFallback = core.getInput('pv-fallback') || null;
    let deep = parseInt(core.getInput('deep')) || 1;
    let workspace = ((_a = process.env['GITHUB_WORKSPACE']) === null || _a === void 0 ? void 0 : _a.toString()) || null;
    if (!workDir || workDir === ".") {
        workDir = getWorkingDirectory(workspace);
    }
    let result = run(workDir, deep, jvFallback, pvFallback);
    result.set('platform', process.platform);
    result.set('deep', deep);
    result.set('work-dir', workDir);
    result.set('jv-fallback', jvFallback);
    result.set('pv-fallback', pvFallback);
    result.set('GITHUB_WORKSPACE', workspace || null);
    console.log(JSON.stringify(Object.fromEntries(sortMap(result)), null, 4));
    result.forEach((value, key) => {
        core.setOutput(key, value);
    });
}
catch (e) {
    if (typeof e === "string") {
        core.setFailed(e.toUpperCase());
    }
    else if (e instanceof Error) {
        core.setFailed(e.message);
    }
}
function run(workDir, deep, jvFallback, pvFallback) {
    //DEFAULTS
    let result = new Map([
        ['cmd', null],
        ['cmd_test', null],
        ['cmd_build', null],
        ['is_maven', false],
        ['is_gradle', false],
        ['has_wrapper', false],
        ['java_version', null],
        ['artifact_name', null],
        ['cmd_test_build', null],
        ['builder_version', null],
        ['project_version', null],
        ['cmd_update_deps', null],
        ['cmd_update_plugs', null],
        ['cmd_update_props', null],
        ['artifact_name_jar', null],
        ['cmd_update_parent', null],
        ['cmd_update_wrapper', null]
    ]);
    //PROCESSING
    (0, process_maven_1.runMaven)(result, workDir, deep);
    (0, process_gradle_1.runGradle)(result, workDir, deep);
    //POST PROCESSING
    result.set('project_version', result.get('project_version') || pvFallback || null);
    if (!result.get('java_version') && jvFallback > 0) {
        result.set('java_version', jvFallback);
        result.set('java_version_legacy', jvFallback < 10 ? `1.${jvFallback}` : jvFallback.toString());
    }
    return result;
}
function getWorkingDirectory(workspace) {
    return workspace && fs.existsSync(workspace) ? workspace : process.cwd();
}
function sortMap(input) {
    const sortedEntries = Array.from(input.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return new Map(sortedEntries);
}
module.exports = { run };
