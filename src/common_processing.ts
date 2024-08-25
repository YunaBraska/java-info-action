import fs, {PathOrFileDescriptor} from "fs";
import path from "path";

export type ResultType = string | number | boolean | null;
const ARTIFACT_NAME_PROPS = ['project.build.finalName', 'baseName', 'archiveFileName'];
const PROJECT_ENCODING_PROPS = [
    'project.encoding',
    'options.encoding',
    'groovyOptions.encoding',
    'project.build.sourceEncoding',
    'project.reporting.outputEncoding',
]
const JAVA_VERSION_PROPS = [
    'java.version',
    'java_version',
    'java-version',
    'languageVersion',
    'sourceCompatibility',
    'targetCompatibility',
    'maven.compiler.source',
    'maven.compiler.target',
    'maven.compiler.release',
    'project.build.plugins.plugin.org.apache.maven.plugins.maven-compiler-plugin.configuration.source',
    'project.build.plugins.plugin.org.apache.maven.plugins.maven-compiler-plugin.configuration.target',
    'project.build.plugins.plugin.org.apache.maven.plugins.maven-compiler-plugin.configuration.release'
];

export function isEmpty(input: string | number | boolean | null | undefined): boolean {
    return input === null || input === undefined || String(input).trim().length === 0;
}

export function str(result: string | number | boolean | null | undefined): string {
    return (result ?? '').toString();
}

export function int(result: string | number | boolean | null | undefined): number {
    if (typeof result === 'number') {
        return result;
    } else if (typeof result === 'string') {
        const parsedInt = Number.parseInt(result, 10);
        if (Number.isNaN(parsedInt)) {
            return 0;
        }
        return parsedInt;
    } else {
        return 0;
    }
}

export function replaceNullWithEmptyMap(input: Map<string, any>): Map<string, any> {
    const output = new Map<string, any>();
    input.forEach((value, key) => {
        if (value === null || value === undefined || value === 'null') {
            output.set(key, '');
        } else {
            output.set(key, value);
        }
    });
    return output;
}

export function setCommonResults(result: Map<string, ResultType>, propertyMap: Map<string, string>): Map<string, ResultType> {
    resolvePropertyMap(propertyMap);
    setProjectVersion(result, propertyMap);
    setJavaVersion(result, propertyMap);
    setArtifactName(result, propertyMap);
    setEncoding(result, propertyMap);
    addPropertiesToResult(result, propertyMap);
    return result;
}

export function addKeyValue(map: Map<string, string>, key: string, value: string): void {
    let counter = 0;
    if (map.get(key)) {
        map.forEach((v, k) => {
            k = k.includes('#') ? k.substring(0, k.indexOf('#')) : k;
            if (key === k) {
                counter++
            }
        });
    }
    map.set(counter > 0 ? key + '#' + counter : key, value);
}

export function listFiles(dir: PathOrFileDescriptor, deep: number, filter: string, resultList: PathOrFileDescriptor[], deep_current: number): PathOrFileDescriptor[] {
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

function getValue(propertyMap: Map<string, string>, nodeNames: string[]): string | null {
    let values = getValues(propertyMap, nodeNames, null);
    return values && values.length > 0 ? values[0] : null;
}

function getValues(propertyMap: Map<string, string>, nodeNames: string[], regex: string | undefined | null): string[] {
    let result: string[] = [];
    nodeNames.forEach(key => {
        if (propertyMap.get(key)) {
            for (let [mapKey, mapValue] of propertyMap) {
                if (mapValue !== key && (mapKey === key || mapKey.startsWith(key + '#'))) {
                    mapValue = propertyMap.get(mapValue) || mapValue
                    if (!regex || (mapValue && new RegExp(regex).exec(mapValue))) {
                        result.push(mapValue)
                    }
                }
            }
        }
    })
    return result.filter(value => value && value.trim().length > 0).map(value => value!.trim() || '');
}

function addPropertiesToResult(result: Map<string, ResultType>, propertyMap: Map<string, string>): void {
    Array.from(propertyMap.keys()).forEach(key => {
        result.set('x_' + key.replace('#', '-').replace(/\./g, '_'), propertyMap.get(key) || '')
    });
}

function setEncoding(result: Map<string, ResultType>, propertyMap: Map<string, string>): void {
    let projectVersions = getValues(propertyMap, PROJECT_ENCODING_PROPS, null);
    if (projectVersions.length > 0) {
        result.set('project_encoding', projectVersions[0]);
    }
}

function setProjectVersion(result: Map<string, ResultType>, propertyMap: Map<string, string>): void {
    let projectVersions = getValues(propertyMap, ['project.version'], '\\d+');
    if (projectVersions.length > 0) {
        result.set('project_version', projectVersions[0]);
    }
}

function setArtifactName(result: Map<string, ResultType>, propertyMap: Map<string, string>): void {
    let finalName = getValue(propertyMap, ARTIFACT_NAME_PROPS);
    if (finalName) {
        let finalNameNoJar = finalName.endsWith('.jar') ? finalName.substring(0, finalName.length - '.jar'.length) : finalName;
        let finalNameJar = finalNameNoJar + '.jar';
        let artifactNames_jar = (result.get('artifact_names_jar') || '').toString();
        result.set('artifact_name', finalNameNoJar);
        result.set('artifact_name_jar', finalNameJar);
        if (!artifactNames_jar.includes(finalNameJar)) {
            result.set('artifact_names', [result.get('artifact_names'), finalNameNoJar].map(value => (value || '').toString()).filter(value => value.length > 0).join(', '));
            result.set('artifact_names_jar', [artifactNames_jar, finalNameJar].map(value => (value || '').toString()).filter(value => value.length > 0).join(', '));
        }
    }
}

function setJavaVersion(result: Map<string, ResultType>, propertyMap: Map<string, string>): void {
    let javaVersions = getValues(propertyMap, JAVA_VERSION_PROPS, '\\d+')
        .map(jv => jv.includes('.') ? jv.substring(jv.indexOf('.') + 1) : jv)
        .map(jv => jv.includes('_') ? jv.substring(jv.indexOf('_') + 1) : jv)
        .map(jv => parseInt(jv) || -1)
        .filter(jv => jv != -1);

    if (javaVersions && javaVersions.length > 0) {
        const javaVersion = Math.max(...javaVersions);
        if (javaVersion && (!result.get('java_version') || (result.get('java_version') as number) < javaVersion)) {
            result.set('java_version', javaVersion);
        }
    }
}

//FIXME: resolve keys with #1, #2, #3
function resolvePropertyMap(propertyMap: Map<string, string>): Map<string, string> {
    Array.from(propertyMap.keys()).forEach(key => {
        const resolvedValue = resolveProperty(propertyMap, propertyMap.get(key) || null);
        if (resolvedValue) {
            propertyMap.set(key, resolvedValue);
        }
    });
    return propertyMap;
}


function resolveProperty(propertyMap: Map<string, string>, value: string | null): string {
    let result = ""
    if (value) {
        //MAVEN
        result = value.replace(/\${(.*?)}/g, (match, placeholder) => {
            return propertyMap.get(placeholder) || match;
        }).trim()
        //GRADLE
        result = propertyMap.get(value) || result
    }
    return result;
}
