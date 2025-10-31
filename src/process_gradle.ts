import fs, {PathOrFileDescriptor} from "fs";
import {addKeyValue, listFiles, ResultType, setCommonResults} from './common_processing';
import path from "path";
//https://services.gradle.org/versions/all
//https://gradle.org/releases/

export function runGradle(result: Map<string, ResultType>, workDir: PathOrFileDescriptor, deep: number) {
    let files = listGradleFiles(workDir, deep);
    if (files.length > 0) {
        process(files, result);
        result.set('builder_name', 'Gradle');
        result.set('is_gradle', true);
    }
}

export function listGradleFiles(workDir: PathOrFileDescriptor, deep: number): PathOrFileDescriptor[] {
    return listFiles(workDir, deep, 'build\\.gradle.*', [], 0);
}

export function readBuilderVersion(wrapperMapFile: PathOrFileDescriptor, fallback: string | null): string | null {
    if (fs.existsSync(wrapperMapFile.toString())) {
        let wrapperMap = readPropertiesGradle(wrapperMapFile);
        let distributionUrl = wrapperMap.get('distributionUrl')
        let builderVersion = distributionUrl ? new RegExp('(\\d[\._]?){2,}').exec(distributionUrl) : null;
        return builderVersion ? builderVersion[0] : fallback;
    }
    return fallback;
}


function process(gradleFiles: PathOrFileDescriptor[], result: Map<string, ResultType>): Map<string, ResultType> {
    gradleFiles.forEach(file => {
            try {
                let dir = path.dirname(file.toString());
                let wrapperMapFile = path.join(dir, 'gradle', 'wrapper', 'gradle-wrapper.properties');
                setCommonResults(result, readPropertiesGradle(file));
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
    result.set('builder_folder', "build")
    result.set('cmd', result.get('has_wrapper') ? (result.get('platform') === "win32" ? 'gradle.bat' : './gradlew') : 'gradle');
    result.set('cmd_custom', result.get('cmd') + ' ' + result.get('custom-gradle-cmd'));
    result.set('cmd_test', result.get('cmd') + ' clean test');
    result.set('cmd_build', result.get('cmd') + ' clean build -x test');
    result.set('cmd_test_build', result.get('cmd') + ' clean build');
    result.set('cmd_update_deps', result.get('cmd') + '  --version');
    result.set('cmd_update_plugs', result.get('cmd') + '  --version');
    result.set('cmd_update_props', result.get('cmd') + '  --version');
    result.set('cmd_update_parent', result.get('cmd') + ' --refresh-dependencies');
    result.set('cmd_resolve_deps', result.get('cmd') + ' --refresh-dependencies check -x test');
    result.set('cmd_update_wrapper', result.get('cmd') + ' wrapper --gradle-version 9.2.0');
    return result;
}

function readPropertiesGradle(file: PathOrFileDescriptor): Map<string, string> {
    let result = new Map<string, string>;
    fs.readFileSync(file, {encoding: 'utf-8'}).split(/\r?\n/).forEach(function (line: string) {
        let splitter = line.indexOf('=');
        splitter = splitter > 0 ? splitter : line.indexOf('.set(');
        if (splitter > 0) {
            let key = line.substring(0, splitter).trim();
            let value = line.substring(splitter + 1).trim()
            let indexDot = value.indexOf('.')
            let indexOpen = indexDot != -1 ? value.indexOf('(', indexDot) + 1 : -1
            let indexClose = indexOpen != -1 ? value.indexOf(')', indexOpen) : -1
            //Gradle KTS Variable
            if (indexDot < indexOpen && indexOpen < indexClose) {
                value = value.substring(indexOpen, indexClose)
            }
            value = value.startsWith('set') && value.endsWith(')') ? value.substring(3, value.length - 1).trim() : value;
            //CleanUp
            key = key.startsWith('def') || key.startsWith('val') ? key.substring(3).trim() : key;
            value = value.replace(/[()]+/g, '').trim().replace(/['"]+/g, '').trim();
            addKeyValue(result, key, value)
        }
    })
    return result;
}
