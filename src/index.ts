//https://github.com/actions/toolkit/tree/main/packages/
import {PathOrFileDescriptor} from "fs";
import {XmlElement} from "xmldoc";

const core = require('@actions/core');
const fs = require('fs');
const path = require('path');
const xmlReader = require('xmldoc');

try {
    let workDir = core.getInput('work-dir');
    let jvFallback = core.getInput('jv-fallback') || 17;
    let deep = parseInt(core.getInput('deep')) || 1;
    let workspace = process.env['GITHUB_WORKSPACE']?.toString() || null;
    if (!workDir || workDir === ".") {
        workDir = getWorkingDirectory(workspace)
    }
    console.log(`deep [${deep}]`)
    console.log(`workDir [${workDir}]`)
    console.log(`workspace [${workspace}]`)
    console.log(`jvFallback [${jvFallback}]`)
    //TODO: auto update java & gradle versions
    let result = run(workDir, deep, jvFallback);
    result.set('deep', deep);
    result.set('work-dir', workDir);
    result.set('jv-fallback', jvFallback);
    result.set('GITHUB_WORKSPACE', workspace || null);

    console.log(`result [${result.size}]`)
    console.log(JSON.stringify(result, null, 4))

    result.forEach((value, key) => {
        core.setOutput(key, value);
        console.log(`key [${key}], key [${value}]`)
    })
} catch (e) {
    if (typeof e === "string") {
        core.setFailed(e.toUpperCase());
    } else if (e instanceof Error) {
        core.setFailed(e.message);
    }
}

function run(workDir: PathOrFileDescriptor, deep: number, jvFallback: number): Map<string, string | number | boolean | null> {
    //DEFAULTS
    let result = new Map<string, string | number | boolean | null>([
        ['cmd', null],
        ['cmd_test', null],
        ['cmd_build', null],
        ['cmd_test_build', null],
        ['cmd_update_deps', null],
        ['cmd_update_plugs', null],
        ['cmd_update_props', null],
        ['cmd_update_parent', null],
        ['cmd_update_wrapper', null],
        ['java_version', null],
        ['has_wrapper', false],
        ['builder_version', null],
        ['is_gradle', false],
        ['is_maven', false]
    ]);
    //PROCESSING
    let mavenFiles = listMavenFiles(workDir, deep);
    let gradleFiles = listGradleFiles(workDir, deep);
    if (gradleFiles.length > 0) {
        result = readGradle(gradleFiles, result);
    } else if (mavenFiles.length > 0) {
        result = readMaven(mavenFiles, result);
    }

    //POST PROCESSING
    result.set('java_version', result.get('java_version') ? (result.get('java_version') as number) : jvFallback);

    result.set('java_version_legacy', toLegacyJavaVersion(result.get('java_version')));
    result.set('is_gradle', gradleFiles.length > 0);
    result.set('is_maven', mavenFiles.length > 0);
    return result;
}

function readMaven(mavenFiles: PathOrFileDescriptor[], result: Map<string, string | number | boolean | null>): Map<string, string | number | boolean | null> {
    result.set('is_maven', mavenFiles.length > 0);
    mavenFiles.forEach(file => {
            try {
                let dir = path.dirname(file.toString());
                let wrapperMapFile = path.join(dir, '.mvn', 'wrapper', 'maven-wrapper.properties');

                let javaVersion = readJavaVersionMaven(file);
                if (javaVersion && (!result.get('java_version') || (result.get('java_version') as number) < javaVersion)) {
                    result.set('java_version', javaVersion);
                }

                if (fs.existsSync(path.join(dir, 'mvnw.cmd')) || fs.existsSync(path.join(dir, 'mvnw')) || fs.existsSync(wrapperMapFile)) {
                    result.set('has_wrapper', true);
                }

                if (fs.existsSync(wrapperMapFile)) {
                    result.set('builder_version', readBuilderVersion((wrapperMapFile as PathOrFileDescriptor), (result.get('builder_version') as string | null)));
                }
            } catch (err) {
                console.error(err);
            }
        }
    )

    result.set('cmd', result.get('has_wrapper') ? (process.platform === "win32" ? 'mvn.cmd' : './mvnw') : 'mvn');
    result.set('cmd_test', result.get('cmd') + ' clean test');
    result.set('cmd_build', result.get('cmd') + ' clean package -DskipTests');
    result.set('cmd_test_build', result.get('cmd') + ' clean package');
    result.set('cmd_update_deps', result.get('cmd') + ' versions:use-latest-versions -B -q -DgenerateBackupPoms=false');
    result.set('cmd_update_plugs', result.get('cmd') + ' versions:use-latest-versions -B -q -DgenerateBackupPoms=false');
    result.set('cmd_update_props', result.get('cmd') + ' versions:update-properties -B -q -DgenerateBackupPoms=false');
    result.set('cmd_update_parent', result.get('cmd') + ' versions:update-parent -B -q -DgenerateBackupPoms=false');
    result.set('cmd_update_wrapper', result.get('cmd') + ' -B -q -N io.takari:maven:wrapper');
    return result;
}

function readJavaVersionMaven(file: PathOrFileDescriptor): number | null | undefined {
    let document = new xmlReader.XmlDocument(fs.readFileSync(file, {encoding: 'utf-8'}));
    let propertyMap = new Map(
        getNodeByPath(document, ['properties'], 0)[0]
            ?.children.filter(node => node.type === 'element')
            ?.map(node => [(node as XmlElement).name, (node as XmlElement).val])
    );
    let javaVersions = getNodeByPath(document, ['build', 'plugins', 'plugin|artifactId=maven-compiler-plugin', 'configuration'], 0)[0]
        ?.children.filter(node => node.type === 'element')
        ?.map(node => (node as XmlElement).val?.trim());


    let result: number | null = null;
    javaVersions?.forEach(jv => {
        let version = javaVersionOf(jv.startsWith('${') ? propertyMap.get(jv.substring(2, jv.length - 1)) : jv);
        result = version && (!result || result < version) ? version : result;
    })
    for (const pjv of ['java.version', 'java-version', 'maven.compiler.source', 'maven.compiler.target', 'maven.compiler.release']) {
        let jv = propertyMap.get(pjv);
        let version = jv ? javaVersionOf(jv.startsWith('${') ? propertyMap.get(jv.substring(2, jv.length - 1)) : jv) : undefined;
        result = version && (!result || result < version) ? version : result;
    }
    return result;
}

function readGradle(gradleFiles: PathOrFileDescriptor[], result: Map<string, string | number | boolean | null>): Map<string, string | number | boolean | null> {
    let gradleLTS = '7.5.1';
    result.set('is_gradle', gradleFiles.length > 0);
    gradleFiles.forEach(file => {
            try {
                let dir = path.dirname(file.toString());
                let wrapperMapFile = path.join(dir, 'gradle', 'wrapper', 'gradle-wrapper.properties');

                let javaVersion = readJavaVersionGradle(file);
                if (javaVersion && (!result.get('java_version') || (result.get('java_version') as number) < javaVersion)) {
                    result.set('java_version', javaVersion);
                }

                if (fs.existsSync(path.join(dir, 'gradle.bat')) || fs.existsSync(path.join(dir, 'gradlew')) || fs.existsSync(wrapperMapFile)) {
                    result.set('has_wrapper', true);
                }

                if (fs.existsSync(wrapperMapFile)) {
                    result.set('builder_version', readBuilderVersion(wrapperMapFile, (result.get('builder_version') as string | null)));
                }
            } catch (err) {
                console.error(err);
            }
        }
    )
    result.set('cmd', result.get('has_wrapper') ? (process.platform === "win32" ? 'gradle.bat' : './gradlew') : 'gradle');
    result.set('cmd_test', result.get('cmd') + ' clean test');
    result.set('cmd_build', result.get('cmd') + ' clean build -x test');
    result.set('cmd_test_build', result.get('cmd') + ' clean build');
    result.set('cmd_update_deps', result.get('cmd') + ' check');
    result.set('cmd_update_plugs', result.get('cmd') + ' check');
    result.set('cmd_update_props', result.get('cmd') + ' check');
    result.set('cmd_update_parent', result.get('cmd') + ' check');
    result.set('cmd_update_wrapper', result.get('cmd') + ' wrapper --gradle-version ' + gradleLTS);
    return result;
}

function readBuilderVersion(wrapperMapFile: PathOrFileDescriptor, fallback: string | null): string | null {
    if (fs.existsSync(wrapperMapFile.toString())) {
        let wrapperMap = readPropertiesGradle(wrapperMapFile);
        let distributionUrl = wrapperMap.get('distributionUrl')
        let builderVersion = distributionUrl ? new RegExp('(\\d[\._]?){2,}').exec(distributionUrl) : null;
        return builderVersion ? builderVersion[0] : fallback;
    }
    return fallback;
}

function javaVersionOf(string: string | undefined | null): number | null {
    if (string) {
        string = string.includes("_") ? string.substring(string.indexOf("_") + 1) : string;
        string = string.includes(".") ? string.substring(string.indexOf(".") + 1) : string;
        return parseInt(string.trim());
    }
    return null;
}

function readJavaVersionGradle(file: PathOrFileDescriptor): number | null {
    let propertyMap = readPropertiesGradle(file);
    let value = propertyMap.get('sourceCompatibility') || propertyMap.get('targetCompatibility')
    return value ? javaVersionOf(propertyMap.get(value) || value) : null;
}

function readPropertiesGradle(file: PathOrFileDescriptor): Map<string, string> {
    let result = new Map<string, string>;
    fs.readFileSync(file, {encoding: 'utf-8'}).split(/\r?\n/).forEach(function (line: string) {
        let eq = line.indexOf('=');
        if (eq > 0) {
            let key = line.substring(0, eq).trim()
            let spaceIndex = key.lastIndexOf(' ');
            result.set(spaceIndex > 0 ? key.substring(spaceIndex + 1).trim() : key, line.substring(eq + 1).trim().replace(/['"]+/g, ''));
        } else if (!result.get('sourceCompatibility') && !result.get('targetCompatibility') && line.includes('languageVersion.set')) {
            result.set('targetCompatibility', line.trim()
                .replace('JavaLanguageVersion', '')
                .replace('languageVersion.set', '')
                .replace('.of', '').trim()
                .replace(/[()]+/g, '')
                .replace(/['"]+/g, '')
            );
        }
    })
    return result;
}

function listGradleFiles(workDir: PathOrFileDescriptor, deep: number): PathOrFileDescriptor[] {
    return listFiles(workDir, !deep ? 1 : deep, 'build\.gradle.*', [], 0);
}

function listMavenFiles(workDir: PathOrFileDescriptor, deep: number): PathOrFileDescriptor[] {
    return listFiles(workDir, !deep ? 1 : deep, 'pom.*\.xml', [], 0);
}

function listFiles(dir: PathOrFileDescriptor, deep: number, filter: string, resultList: PathOrFileDescriptor[], deep_current: number): PathOrFileDescriptor[] {
    deep = deep || 1
    deep_current = deep_current || 0
    resultList = resultList || []
    if (deep > -1 && deep_current > deep) {
        return resultList;
    }
    const files = fs.readdirSync(dir.toString(), {withFileTypes: true});
    for (const file of files) {
        if (file.isDirectory()) {
            listFiles(path.join(dir.toString(), file.name), deep, filter, resultList, deep_current++);
        } else if (!filter || new RegExp(filter).test(file.name)) {
            resultList.push(path.join(dir.toString(), file.name));
        }
    }
    return resultList;
}


function getWorkingDirectory(workspace: string | undefined | null): PathOrFileDescriptor {
    return workspace && fs.existsSync(workspace) ? workspace : process.cwd();
}

function getNodeByPath(node: XmlElement, nodeNames: string[], index: number): XmlElement[] {
    index = index || 0;
    if (nodeNames.length === index) {
        return [node];
    }

    let nodeName = nodeNames[index].split('|');
    return node.childrenNamed(nodeName[0])
        .filter(node => node.type === 'element')
        .filter(node => matchFilter(node, nodeName[1]))
        .filter(node => node.childrenNamed(nodeNames[index + 1]))
        .flatMap(node => getNodeByPath(node, nodeNames, index + 1))
}

function matchFilter(node: XmlElement, filter: string): boolean {
    if (!node || !filter) {
        return true;
    }
    let kv = filter.split('=');
    let childNode = node.childrenNamed(kv[0])
    return childNode && childNode[0]?.val === kv[1];
}

function toLegacyJavaVersion(javaVersion: string | number | boolean | null | undefined): string | null {
    if (javaVersion) {
        return (javaVersion as number) < 10 ? '1.' + javaVersion : javaVersion.toString();
    }
    return null;
}

module.exports = {run, listGradleFiles, listMavenFiles};
