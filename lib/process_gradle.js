"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readBuilderVersion = exports.listGradleFiles = exports.runGradle = void 0;
const fs_1 = __importDefault(require("fs"));
const common_processing_1 = require("./common_processing");
const path_1 = __importDefault(require("path"));
//https://services.gradle.org/versions/all
//https://gradle.org/releases/
const GRADLE_LTS_VERSION = '8.0.2';
function runGradle(result, workDir, deep) {
    let files = listGradleFiles(workDir, deep);
    if (files.length > 0) {
        process(files, result);
        result.set('builder_name', 'Gradle');
        result.set('is_gradle', true);
    }
}
exports.runGradle = runGradle;
function listGradleFiles(workDir, deep) {
    return (0, common_processing_1.listFiles)(workDir, !deep ? 1 : deep, 'build\.gradle.*', [], 0);
}
exports.listGradleFiles = listGradleFiles;
function readBuilderVersion(wrapperMapFile, fallback) {
    if (fs_1.default.existsSync(wrapperMapFile.toString())) {
        let wrapperMap = readPropertiesGradle(wrapperMapFile);
        let distributionUrl = wrapperMap.get('distributionUrl');
        let builderVersion = distributionUrl ? new RegExp('(\\d[\._]?){2,}').exec(distributionUrl) : null;
        return builderVersion ? builderVersion[0] : fallback;
    }
    return fallback;
}
exports.readBuilderVersion = readBuilderVersion;
function process(gradleFiles, result) {
    gradleFiles.forEach(file => {
        try {
            let dir = path_1.default.dirname(file.toString());
            let wrapperMapFile = path_1.default.join(dir, 'gradle', 'wrapper', 'gradle-wrapper.properties');
            (0, common_processing_1.setCommonResults)(result, readPropertiesGradle(file));
            if (fs_1.default.existsSync(path_1.default.join(dir, 'gradle.bat')) || fs_1.default.existsSync(path_1.default.join(dir, 'gradlew')) || fs_1.default.existsSync(wrapperMapFile)) {
                result.set('has_wrapper', true);
            }
            if (fs_1.default.existsSync(wrapperMapFile)) {
                result.set('builder_version', readBuilderVersion(wrapperMapFile, result.get('builder_version')));
            }
        }
        catch (err) {
            console.error(err);
        }
    });
    result.set('cmd', result.get('has_wrapper') ? (result.get('platform') === "win32" ? 'gradle.bat' : './gradlew') : 'gradle');
    result.set('cmd_test', result.get('cmd') + ' clean test');
    result.set('cmd_build', result.get('cmd') + ' clean build -x test');
    result.set('cmd_test_build', result.get('cmd') + ' clean build');
    result.set('cmd_update_deps', result.get('cmd') + ' check');
    result.set('cmd_update_plugs', result.get('cmd') + ' check');
    result.set('cmd_update_props', result.get('cmd') + ' check');
    result.set('cmd_update_parent', result.get('cmd') + ' check');
    result.set('cmd_resolve_plugs', result.get('cmd') + ' check');
    result.set('cmd_resolve_deps', result.get('cmd') + ' --refresh-dependencies check -x test');
    result.set('cmd_update_wrapper', result.get('cmd') + ' wrapper --gradle-version ' + GRADLE_LTS_VERSION);
    return result;
}
function readPropertiesGradle(file) {
    let result = new Map;
    fs_1.default.readFileSync(file, { encoding: 'utf-8' }).split(/\r?\n/).forEach(function (line) {
        let splitter = line.indexOf('=');
        splitter = splitter > 0 ? splitter : line.indexOf('.set(');
        if (splitter > 0) {
            let key = line.substring(0, splitter).trim();
            let value = line.substring(splitter + 1).trim();
            let indexDot = value.indexOf('.');
            let indexOpen = indexDot != -1 ? value.indexOf('(', indexDot) + 1 : -1;
            let indexClose = indexOpen != -1 ? value.indexOf(')', indexOpen) : -1;
            //Gradle KTS Variable
            if (indexDot < indexOpen && indexOpen < indexClose) {
                value = value.substring(indexOpen, indexClose);
            }
            value = value.startsWith('set') && value.endsWith(')') ? value.substring(3, value.length - 1).trim() : value;
            //CleanUp
            key = key.startsWith('def') || key.startsWith('val') ? key.substring(3).trim() : key;
            value = value.replace(/[()]+/g, '').trim().replace(/['"]+/g, '').trim();
            (0, common_processing_1.addKeyValue)(result, key, value);
        }
    });
    return result;
}
