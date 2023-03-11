//https://github.com/actions/toolkit/tree/main/packages/
import {PathOrFileDescriptor} from "fs";
import {ResultType} from './common_processing';
import {runMaven} from './process_maven';
import {runGradle} from './process_gradle';

const core = require('@actions/core');
const fs = require('fs');
//https://api.adoptium.net/v3/info/available_releases
//TODO: auto update java & gradle versions
const JAVA_LTS_VERSION = '17';

try {
    let workDir = core.getInput('work-dir');
    let jvFallback = core.getInput('jv-fallback') || JAVA_LTS_VERSION;
    let pvFallback = core.getInput('pv-fallback') || null;
    let peFallback = core.getInput('pe-fallback') || 'utf-8';
    let deep = parseInt(core.getInput('deep')) || 1;
    let workspace = process.env['GITHUB_WORKSPACE']?.toString() || null;
    if (!workDir || workDir === ".") {
        workDir = getWorkingDirectory(workspace)
    }
    let result = new Map<string, ResultType>([
        ['GITHUB_WORKSPACE', workspace || null],
        ['platform', process.platform]
    ]);
    run(result, workDir, deep, jvFallback, pvFallback, peFallback);
    console.log(JSON.stringify(Object.fromEntries(sortMap(result)), null, 4))

    result.forEach((value, key) => {
        core.setOutput(key, value);
    })
} catch (e) {
    if (typeof e === "string") {
        core.setFailed(e.toUpperCase());
    } else if (e instanceof Error) {
        core.setFailed(e.message);
    }
}

function run(result: Map<string, ResultType>, workDir: PathOrFileDescriptor, deep: number, jvFallback: number, pvFallback: number, peFallback: string): Map<string, ResultType> {
    //PRE PROCESSING
    deep = !deep ? 1 : deep;
    result = !result ? new Map<string, ResultType>([]) : result;
    result.set('cmd', null);
    result.set('cmd_test', null);
    result.set('cmd_build', null);
    result.set('is_maven', false);
    result.set('is_gradle', false);
    result.set('builder_name', null);
    result.set('has_wrapper', false);
    result.set('java_version', null);
    result.set('artifact_name', null);
    result.set('artifact_names', null);
    result.set('cmd_test_build', null);
    result.set('builder_version', null);
    result.set('project_version', null);
    result.set('project_encoding', null);
    result.set('cmd_update_deps', null);
    result.set('cmd_update_plugs', null);
    result.set('cmd_update_props', null);
    result.set('artifact_name_jar', null);
    result.set('cmd_update_parent', null);
    result.set('artifact_names_jar', null);
    result.set('cmd_update_wrapper', null);
    result.set('deep', deep);
    result.set('work-dir', workDir.toString());
    result.set('jv-fallback', jvFallback);
    result.set('pv-fallback', pvFallback);
    result.set('pe-fallback', peFallback);

    //PROCESSING
    runMaven(result, workDir, deep);
    runGradle(result, workDir, deep);

    //POST PROCESSING
    result.set('project_version', result.get('project_version') || pvFallback || null);
    result.set('project_encoding', result.get('project_encoding') || peFallback || null);
    if (!(result.get('java_version') as number) && jvFallback > 0) {
        result.set('java_version', jvFallback);
        result.set('java_version_legacy', jvFallback < 10 ? `1.${jvFallback}` : jvFallback.toString());
    }
    return result;
}

function getWorkingDirectory(workspace: string | undefined | null): PathOrFileDescriptor {
    return workspace && fs.existsSync(workspace) ? workspace : process.cwd();
}

function sortMap(input: Map<string, any>): Map<string, any> {
    const sortedEntries = Array.from(input.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return new Map(sortedEntries);
}

module.exports = {run};
