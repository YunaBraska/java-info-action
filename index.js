//https://github.com/actions/toolkit/tree/main/packages/
const core = require('@actions/core');
const fs = require('fs');
const path = require('path');
const xmlReader = require('xmldoc');

try {
    let workDir = core.getInput('work-dir');
    let jvFallback = core.getInput('jv-fallback');
    let deep = parseInt(core.getInput('deep'));
    if (!workDir || workDir === ".") {
        workDir = getWorkingDirectory()
    }
    //TODO: auto update java version fallback
    console.log('jv_fallback [' + (!jvFallback ? 17 : jvFallback) + ']');
    console.log('deep [' + (!deep ? 1 : deep) + ']');
    console.log(`work-dir [${workDir}]`);

    result = run(workDir, deep, jvFallback);

    console.log(JSON.stringify(result, null, 4))

    for (const [key, value] of Object.entries(result)) {
        core.setOutput(key, value);
    }
} catch (error) {
    core.setFailed(error.message);
}

function run(workDir, deep, jvFallback) {
    //DEFAULTS
    let result = {};
    result['cmd'] = null
    result['cmd_test'] = null
    result['cmd_build'] = null
    result['cmd_test_build'] = null
    result['cmd_update_deps'] = null
    result['cmd_update_plugs'] = null
    result['cmd_update_props'] = null
    result['cmd_update_parent'] = null
    result['cmd_update_wrapper'] = null
    result['java_version'] = null;
    result['has_wrapper'] = false;
    result['builder_version'] = null;
    result['is_gradle'] = false
    result['is_maven'] = false

    //PROCESSING
    let mavenFiles = listMavenFiles(workDir, deep);
    let gradleFiles = listGradleFiles(workDir, deep);
    if (gradleFiles.length > 0) {
        result = readGradle(gradleFiles, jvFallback);
    } else if (mavenFiles.length > 0) {
        result = readMaven(mavenFiles);
    }

    //POST PROCESSING
    result['java_version'] = result['java_version'] ? result['java_version'] : jvFallback;
    result['java_version_legacy'] = result['java_version'] && result['java_version'] < 10 ? '1.' + result['java_version'] : result['java_version'] ? result['java_version'].toString() : result['java_version'];
    result['is_gradle'] = gradleFiles.length > 0;
    result['is_maven'] = mavenFiles.length > 0;
    return result;
}

function readMaven(mavenFiles) {
    let result = {};
    result['java_version'] = null;
    result['has_wrapper'] = false;
    result['builder_version'] = null;
    result['is_maven'] = mavenFiles.length > 0;
    mavenFiles.forEach(file => {
            try {
                let dir = path.dirname(file);
                let wrapperMapFile = path.join(dir, '.mvn', 'wrapper', 'maven-wrapper.properties');

                let javaVersion = readJavaVersionMaven(file);
                if (javaVersion && (!result['java_version'] || result['java_version'] < javaVersion)) {
                    result['java_version'] = javaVersion;
                }

                if (fs.existsSync(path.join(dir, 'mvnw,cmd')) || fs.existsSync(path.join(dir, 'mvnw')) || fs.existsSync(wrapperMapFile)) {
                    result['has_wrapper'] = true;
                }

                if (fs.existsSync(wrapperMapFile)) {
                    result['builder_version'] = readBuilderVersion(wrapperMapFile, result['builder_version']);
                }
            } catch (err) {
                console.error(err);
            }
        }
    )

    result['cmd'] = result['has_wrapper'] ? (process.platform === "win32" ? 'mvn.cmd' : './mvnw') : 'mvn'
    result['cmd_test'] = result['cmd'] + ' clean test'
    result['cmd_build'] = result['cmd'] + ' clean package -DskipTests'
    result['cmd_test_build'] = result['cmd'] + ' clean package'
    result['cmd_update_deps'] = result['cmd'] + ' versions:use-latest-versions -B -q -DgenerateBackupPoms=false'
    result['cmd_update_plugs'] = result['cmd'] + ' versions:use-latest-versions -B -q -DgenerateBackupPoms=false'
    result['cmd_update_props'] = result['cmd'] + ' versions:update-properties -B -q -DgenerateBackupPoms=false'
    result['cmd_update_parent'] = result['cmd'] + ' versions:update-parent -B -q -DgenerateBackupPoms=false'
    result['cmd_update_wrapper'] = result['cmd'] + ' -B -q -N io.takari:maven:wrapper'
    return result;
}

function readJavaVersionMaven(file) {
    let document = new xmlReader.XmlDocument(fs.readFileSync(file, {encoding: 'utf-8'}));
    let propertyNodes = getNodeByPath(document, ['properties'])[0]?.children.filter(node => node.type === 'element');
    let javaVersions = getNodeByPath(document, ['build', 'plugins', 'plugin|artifactId=maven-compiler-plugin', 'configuration'])[0]?.children.filter(node => node.type === 'element')?.map(e => e.val?.trim())
    let propertyMap = Object.fromEntries(propertyNodes.map(e => [e.name, e.val]))

    let result;
    javaVersions?.forEach(jv => {
        let version = javaVersionOf(jv.startsWith('${') ? propertyMap[jv.substring(2, jv.length - 1)] : jv);
        result = version && (!result || result < version) ? version : result;
    })
    for (const pjv of ['java.version', 'java-version', 'maven.compiler.source', 'maven.compiler.target', 'maven.compiler.release']) {
        let jv = propertyMap[pjv];
        let version = jv ? javaVersionOf(jv.startsWith('${') ? propertyMap[jv.substring(2, jv.length - 1)] : jv) : undefined;
        result = version && (!result || result < version) ? version : result;
    }
    return result;
}

function readGradle(gradleFiles) {
    let result = {}
    let gradleLTS = '7.5.1';
    result['java_version'] = null;
    result['has_wrapper'] = false;
    result['builder_version'] = null;
    result['is_gradle'] = gradleFiles.length > 0;
    gradleFiles.forEach(file => {
            try {
                let dir = path.dirname(file);
                let wrapperMapFile = path.join(dir, 'gradle', 'wrapper', 'gradle-wrapper.properties');

                let javaVersion = readJavaVersionGradle(file);
                if (javaVersion && (!result['java_version'] || result['java_version'] < javaVersion)) {
                    result['java_version'] = javaVersion;
                }

                if (fs.existsSync(path.join(dir, 'gradle.bat')) || fs.existsSync(path.join(dir, 'gradlew')) || fs.existsSync(wrapperMapFile)) {
                    result['has_wrapper'] = true;
                }

                if (fs.existsSync(wrapperMapFile)) {
                    result['builder_version'] = readBuilderVersion(wrapperMapFile, result['builder_version']);
                }
            } catch (err) {
                console.error(err);
            }
        }
    )
    result['cmd'] = result['has_wrapper'] ? (process.platform === "win32" ? 'gradle.bat' : './gradlew') : 'gradle'
    result['cmd_test'] = result['cmd'] + ' clean test'
    result['cmd_build'] = result['cmd'] + ' clean build -x test'
    result['cmd_test_build'] = result['cmd'] + ' clean build'
    result['cmd_update_deps'] = result['cmd'] + ' check'
    result['cmd_update_plugs'] = result['cmd'] + ' check'
    result['cmd_update_props'] = result['cmd'] + ' check'
    result['cmd_update_parent'] = result['cmd'] + ' check'
    result['cmd_update_wrapper'] = result['cmd'] + ' wrapper --gradle-version ' + gradleLTS
    return result;
}

function readBuilderVersion(wrapperMapFile, fallback) {
    if (fs.existsSync(wrapperMapFile)) {
        let wrapperMap = readPropertiesGradle(wrapperMapFile);
        let distributionUrl = wrapperMap['distributionUrl']
        let builderVersion = distributionUrl ? new RegExp('(\\d[\._]?){2,}').exec(distributionUrl) : null;
        return builderVersion ? builderVersion[0] : fallback;
    }
}

function javaVersionOf(string) {
    if (string) {
        string = string.includes("_") ? string.substring(string.indexOf("_") + 1) : string;
        string = string.includes(".") ? string.substring(string.indexOf(".") + 1) : string;
        return parseInt(string.trim());
    }
    return null;
}

function readJavaVersionGradle(file) {
    let properties = readPropertiesGradle(file);
    let value = properties['sourceCompatibility'] || properties['targetCompatibility']
    return value ? javaVersionOf(properties[value] || value) : null;
}

function readPropertiesGradle(file) {
    let result = {}
    fs.readFileSync(file, {encoding: 'utf-8'}).split(/\r?\n/).forEach(line => {
        let eq = line.indexOf('=');
        if (eq > 0) {
            let key = line.substring(0, eq).trim()
            let spaceIndex = key.lastIndexOf(' ');
            result[spaceIndex > 0 ? key.substring(spaceIndex + 1).trim() : key] = line.substring(eq + 1).trim().replaceAll(/['"]+/g, '')
        } else if (!result['sourceCompatibility'] && !result['targetCompatibility'] && line.includes('languageVersion.set')) {
            result['targetCompatibility'] = line
                .replaceAll('JavaLanguageVersion', '')
                .replaceAll('languageVersion.set', '')
                .replaceAll('.of', '').trim()
                .replaceAll(/[()]+/g, '')
                .replaceAll(/['"]+/g, '')
        }
    })
    return result;
}

function listGradleFiles(workDir, deep) {
    return listFiles(workDir, !deep ? 1 : deep, 'build\.gradle.*');
}

function listMavenFiles(workDir, deep) {
    return listFiles(workDir, !deep ? 1 : deep, 'pom.*\.xml');
}

function listFiles(dir, deep, filter, resultList, deep_current) {
    deep = deep || 1
    deep_current = deep_current || 0
    resultList = resultList || []
    if (deep > -1 && deep_current > deep) {
        return resultList;
    }
    const files = fs.readdirSync(dir, {withFileTypes: true});
    for (const file of files) {
        if (file.isDirectory()) {
            listFiles(path.join(dir, file.name), deep, filter, resultList, deep_current++);
        } else if (!filter || new RegExp(filter).test(file.name)) {
            resultList.push(path.join(dir, file.name));
        }
    }
    return resultList;
}


function getWorkingDirectory() {
    let _a;
    return (_a = process.env['GITHUB_WORKSPACE']) !== null && _a !== void 0 ? _a : process.cwd();
}

function getNodeByPath(node, nodeNames, index) {
    index = index || 0;
    if (nodeNames.length === index) {
        return [node];
    }

    let nodeName = nodeNames[index].split('|');
    return node.childrenNamed(nodeName[0])
        .filter(node => node.type === 'element')
        .filter(node => matchFilter(node, nodeName[1]))
        .filter(n => n.childrenNamed(nodeNames[index + 1]))
        .flatMap(n => getNodeByPath(n, nodeNames, index + 1))
}

function matchFilter(node, filter) {
    if (!node || !filter) {
        return true;
    }
    let kv = filter.split('=');
    let childNode = node.childrenNamed(kv[0])
    return childNode && childNode[0]?.val === kv[1];
}

module.exports = {run, listGradleFiles, listMavenFiles};
