"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listFiles = exports.addKeyValue = exports.setCommonResults = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ARTIFACT_NAME_PROPS = ['project.build.finalName', 'baseName', 'archiveFileName'];
const PROJECT_ENCODING_PROPS = [
    'project.encoding',
    'options.encoding',
    'groovyOptions.encoding',
    'project.build.sourceEncoding',
    'project.reporting.outputEncoding',
];
const JAVA_VERSION_PROPS = [
    'java.version',
    'java_version',
    'java-version',
    'languageVersion',
    'sourceCompatibility',
    'targetCompatibility',
    'project.build.plugins.plugin.org.apache.maven.plugins.maven-compiler-plugin.configuration.source',
    'project.build.plugins.plugin.org.apache.maven.plugins.maven-compiler-plugin.configuration.target',
    'project.build.plugins.plugin.org.apache.maven.plugins.maven-compiler-plugin.configuration.release'
];
function setCommonResults(result, propertyMap) {
    resolvePropertyMap(propertyMap);
    setProjectVersion(result, propertyMap);
    setJavaVersion(result, propertyMap);
    setArtifactName(result, propertyMap);
    setEncoding(result, propertyMap);
    addPropertiesToResult(result, propertyMap);
    return result;
}
exports.setCommonResults = setCommonResults;
function addKeyValue(map, key, value) {
    let counter = 0;
    if (map.get(key)) {
        map.forEach((v, k) => {
            k = k.includes('#') ? k.substring(0, k.indexOf('#')) : k;
            if (key === k) {
                counter++;
            }
        });
    }
    map.set(counter > 0 ? key + '#' + counter : key, value);
}
exports.addKeyValue = addKeyValue;
function listFiles(dir, deep, filter, resultList, deep_current) {
    deep = deep || 1;
    deep_current = deep_current || 0;
    resultList = resultList || [];
    if (deep > -1 && deep_current > deep) {
        return resultList;
    }
    const files = fs_1.default.readdirSync(dir.toString(), { withFileTypes: true });
    for (const file of files) {
        if (file.isDirectory()) {
            listFiles(path_1.default.join(dir.toString(), file.name), deep, filter, resultList, deep_current++);
        }
        else if (!filter || new RegExp(filter).test(file.name)) {
            resultList.push(path_1.default.join(dir.toString(), file.name));
        }
    }
    return resultList;
}
exports.listFiles = listFiles;
function getValue(propertyMap, nodeNames) {
    let values = getValues(propertyMap, nodeNames, null);
    return values && values.length > 0 ? values[0] : null;
}
function getValues(propertyMap, nodeNames, regex) {
    let result = [];
    nodeNames.forEach(key => {
        if (propertyMap.get(key)) {
            for (let [mapKey, mapValue] of propertyMap) {
                if (mapValue !== key && (mapKey === key || mapKey.startsWith(key + '#'))) {
                    mapValue = propertyMap.get(mapValue) || mapValue;
                    if (!regex || (mapValue && new RegExp(regex).exec(mapValue))) {
                        result.push(mapValue);
                    }
                }
            }
        }
    });
    return result.filter(value => value && value.trim().length > 0).map(value => value.trim() || '');
}
function addPropertiesToResult(result, propertyMap) {
    Array.from(propertyMap.keys()).forEach(key => {
        result.set('x_' + key.replace('#', '-').replace(/\./g, '_'), propertyMap.get(key) || '');
    });
}
function setEncoding(result, propertyMap) {
    let projectVersions = getValues(propertyMap, PROJECT_ENCODING_PROPS, null);
    if (projectVersions.length > 0) {
        result.set('project_encoding', projectVersions[0]);
    }
}
function setProjectVersion(result, propertyMap) {
    let projectVersions = getValues(propertyMap, ['project.version'], '\\d+');
    if (projectVersions.length > 0) {
        result.set('project_version', projectVersions[0]);
    }
}
function setArtifactName(result, propertyMap) {
    let finalName = getValue(propertyMap, ARTIFACT_NAME_PROPS);
    if (finalName) {
        let finalNameNoJar = finalName.endsWith('.jar') ? finalName.substring(0, finalName.length - '.jar'.length) : finalName;
        result.set('artifact_name', finalNameNoJar);
        result.set('artifact_name_jar', finalNameNoJar + '.jar');
    }
}
function setJavaVersion(result, propertyMap) {
    let javaVersions = getValues(propertyMap, JAVA_VERSION_PROPS, '\\d+')
        .map(jv => jv.includes('.') ? jv.substring(jv.indexOf('.') + 1) : jv)
        .map(jv => jv.includes('_') ? jv.substring(jv.indexOf('_') + 1) : jv)
        .map(jv => parseInt(jv) || -1)
        .filter(jv => jv != -1);
    if (javaVersions && javaVersions.length > 0) {
        const javaVersion = Math.max(...javaVersions);
        if (javaVersion && (!result.get('java_version') || result.get('java_version') < javaVersion)) {
            result.set('java_version', javaVersion);
            result.set('java_version_legacy', javaVersion < 10 ? `1.${javaVersion}` : javaVersion.toString());
        }
    }
}
//FIXME: resolve keys with #1, #2, #3
function resolvePropertyMap(propertyMap) {
    Array.from(propertyMap.keys()).forEach(key => {
        const resolvedValue = resolveProperty(propertyMap, propertyMap.get(key) || null);
        if (resolvedValue) {
            propertyMap.set(key, resolvedValue);
        }
    });
    return propertyMap;
}
function resolveProperty(propertyMap, value) {
    let result = "";
    if (value) {
        //MAVEN
        result = value.replace(/\${(.*?)}/g, (match, placeholder) => {
            return propertyMap.get(placeholder) || match;
        }).trim();
        //GRADLE
        result = propertyMap.get(value) || result;
    }
    return result;
}
