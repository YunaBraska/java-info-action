//https://github.com/actions/toolkit/tree/main/packages/
import {PathOrFileDescriptor} from "fs";
import {ResultType} from './common_processing';
import {runMaven} from './process_maven';
import {runGradle} from './process_gradle';

const core = require('@actions/core');
const fs = require('fs');
//https://api.adoptium.net/v3/info/available_releases
const JAVA_LTS_VERSION = '17';

try {
    //TODO: auto update java & gradle versions
    let workDir = core.getInput('work-dir');
    let jvFallback = core.getInput('jv-fallback') || JAVA_LTS_VERSION;
    let pvFallback = core.getInput('pv-fallback') || null;
    let deep = parseInt(core.getInput('deep')) || 1;
    let workspace = process.env['GITHUB_WORKSPACE']?.toString() || null;
    if (!workDir || workDir === ".") {
        workDir = getWorkingDirectory(workspace)
    }
    let result = run(workDir, deep, jvFallback, pvFallback);
    result.set('platform', process.platform);
    result.set('deep', deep);
    result.set('work-dir', workDir);
    result.set('jv-fallback', jvFallback);
    result.set('pv-fallback', pvFallback);
    result.set('GITHUB_WORKSPACE', workspace || null);

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

function run(workDir: PathOrFileDescriptor, deep: number, jvFallback: number, pvFallback: number): Map<string, ResultType> {
    //DEFAULTS
    let result = new Map<string, ResultType>([
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
        ['project_encoding', null],
        ['cmd_update_deps', null],
        ['cmd_update_plugs', null],
        ['cmd_update_props', null],
        ['artifact_name_jar', null],
        ['cmd_update_parent', null],
        ['cmd_update_wrapper', null]
    ]);
    //PROCESSING
    runMaven(result, workDir, deep);
    runGradle(result, workDir, deep);

    //POST PROCESSING
    result.set('project_version', result.get('project_version') || pvFallback || null);
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
