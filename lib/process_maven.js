"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMavenFiles = exports.runMaven = void 0;
const fs_1 = __importDefault(require("fs"));
const common_processing_1 = require("./common_processing");
const process_gradle_1 = require("./process_gradle");
const path_1 = __importDefault(require("path"));
const xmldoc_1 = __importDefault(require("xmldoc"));
const DUPLICATION_NODES = ['dependency', 'plugin', 'exclusion', 'repository', 'parent', 'developer', 'mailingList', 'extension', 'profile'];
const DUPLICATION_NODE_CHILD_ID_NAMES = ['groupId', 'artifactId', 'id'];
function runMaven(result, workDir, deep) {
    let files = listMavenFiles(workDir, deep);
    if (files.length > 0) {
        process(files, result);
    }
    result.set('is_maven', files.length > 0);
}
exports.runMaven = runMaven;
function listMavenFiles(workDir, deep) {
    return (0, common_processing_1.listFiles)(workDir, !deep ? 1 : deep, 'pom.*\.xml', [], 0);
}
exports.listMavenFiles = listMavenFiles;
function process(mavenFiles, result) {
    result.set('is_maven', mavenFiles.length > 0);
    mavenFiles.forEach(file => {
        try {
            let dir = path_1.default.dirname(file.toString());
            let wrapperMapFile = path_1.default.join(dir, '.mvn', 'wrapper', 'maven-wrapper.properties');
            const propertyMap = xmlToProp(new xmldoc_1.default.XmlDocument(fs_1.default.readFileSync(file, { encoding: 'utf-8' })));
            (0, common_processing_1.setCommonResults)(result, propertyMap);
            //BINARIES
            if (fs_1.default.existsSync(path_1.default.join(dir, 'mvnw.cmd')) || fs_1.default.existsSync(path_1.default.join(dir, 'mvnw')) || fs_1.default.existsSync(wrapperMapFile)) {
                result.set('has_wrapper', true);
            }
            if (fs_1.default.existsSync(wrapperMapFile)) {
                result.set('builder_version', (0, process_gradle_1.readBuilderVersion)(wrapperMapFile, result.get('builder_version')));
            }
        }
        catch (err) {
            console.error(err);
        }
    });
    result.set('cmd', result.get('has_wrapper') ? (result.get('platform') === "win32" ? 'mvn.cmd' : './mvnw') : 'mvn');
    result.set('cmd_test', result.get('cmd') + ' clean test verify -B');
    result.set('cmd_build', result.get('cmd') + ' clean package -DskipTests -B');
    result.set('cmd_test_build', result.get('cmd') + ' clean test verify package -B');
    result.set('cmd_update_deps', result.get('cmd') + ' versions:use-latest-versions -B -q -DgenerateBackupPoms=false');
    result.set('cmd_update_plugs', result.get('cmd') + ' versions:use-latest-versions -B -q -DgenerateBackupPoms=false');
    result.set('cmd_update_props', result.get('cmd') + ' versions:update-properties -B -q -DgenerateBackupPoms=false');
    result.set('cmd_update_parent', result.get('cmd') + ' versions:update-parent -B -q -DgenerateBackupPoms=false');
    result.set('cmd_resolve_plugs', result.get('cmd') + ' dependency:resolve-plugins -B -q');
    result.set('cmd_resolve_deps', result.get('cmd') + ' dependency:resolve -B -q');
    result.set('cmd_update_wrapper', result.get('cmd') + ' -B -q -N io.takari:maven:wrapper');
    return result;
}
function xmlToProp(node) {
    const result = new Map();
    xmlToProperties(node, result);
    return result;
}
function xmlToProperties(node, result, prefix = '') {
    if ((node === null || node === void 0 ? void 0 : node.type) === 'element') {
        let key = (prefix.startsWith('project.properties') ? "" : prefix) + node.name;
        if (node.name && DUPLICATION_NODES.includes(node.name)) {
            DUPLICATION_NODE_CHILD_ID_NAMES.forEach(childName => {
                key = addNodeKey(node, key, childName);
            });
            if (node.name === 'mailingList') {
                key = addNodeKey(node, key, 'name');
            }
        }
        if (node.val.trim().length > 0 && !key.includes('.' + node.val)) {
            (0, common_processing_1.addKeyValue)(result, key, node.val);
        }
        node.eachChild((child) => {
            xmlToProperties(child, result, `${key}.`);
        });
    }
}
function addNodeKey(node, key, childName) {
    var _a;
    const childVal = (_a = node.childNamed(childName)) === null || _a === void 0 ? void 0 : _a.val;
    return childVal ? key + '.' + childVal : key;
}
