import fs, {PathOrFileDescriptor} from "fs";
import {addKeyValue, listFiles, ResultType, setCommonResults} from './common_processing';
import {readBuilderVersion} from './process_gradle';
import path from "path";
import xmlReader, {XmlElement} from "xmldoc";


const DUPLICATION_NODES = ['dependency', 'plugin', 'exclusion', 'repository', 'parent', 'developer', 'mailingList', 'extension', 'profile'];
const DUPLICATION_NODE_CHILD_ID_NAMES = ['groupId', 'artifactId', 'id'];

export function runMaven(result: Map<string, ResultType>, workDir: PathOrFileDescriptor, deep: number) {
    let files = listMavenFiles(workDir, deep);
    if (files.length > 0) {
        process(files, result);
        result.set('builder_name', 'Maven');
        result.set('is_maven', true);
    }
}

export function listMavenFiles(workDir: PathOrFileDescriptor, deep: number): PathOrFileDescriptor[] {
    return listFiles(workDir, deep, 'pom.*\.xml', [], 0);
}

function process(mavenFiles: PathOrFileDescriptor[], result: Map<string, ResultType>): Map<string, ResultType> {
    mavenFiles.forEach(file => {
            try {
                let dir = path.dirname(file.toString());
                let wrapperMapFile = path.join(dir, '.mvn', 'wrapper', 'maven-wrapper.properties');

                const propertyMap = xmlToProp(new xmlReader.XmlDocument(fs.readFileSync(file, {encoding: 'utf-8'})));
                setCommonResults(result, propertyMap);

                //BINARIES
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

    result.set('cmd', result.get('has_wrapper') ? (result.get('platform') === "win32" ? 'mvnw.cmd' : './mvnw') : 'mvn');
    result.set('cmd_custom', result.get('cmd') + ' ' + result.get('custom-maven-cmd'));
    result.set('cmd_test', result.get('cmd') + ' clean test verify -B');
    result.set('cmd_build', result.get('cmd') + ' clean package -DskipTests -B');
    result.set('cmd_test_build', result.get('cmd') + ' clean test verify package -B');
    result.set('cmd_update_deps', result.get('cmd') + ' versions:use-latest-versions -B -q -DgenerateBackupPoms=false');
    result.set('cmd_update_plugs', result.get('cmd') + ' versions:use-latest-versions -B -q -DgenerateBackupPoms=false');
    result.set('cmd_update_props', result.get('cmd') + ' versions:update-properties -B -q -DgenerateBackupPoms=false');
    result.set('cmd_update_parent', result.get('cmd') + ' versions:update-parent -B -q -DgenerateBackupPoms=false');
    result.set('cmd_resolve_plugs', result.get('cmd') + ' dependency:resolve-plugins -B -q');
    result.set('cmd_resolve_deps', result.get('cmd') + ' dependency:resolve -B -q');
    result.set('cmd_update_wrapper', result.get('cmd') + ' -B -q wrapper:wrapper');
    return result;
}


function xmlToProp(node: XmlElement) {
    const result = new Map<string, string>();
    xmlToProperties(node, result);
    return result;
}

function xmlToProperties(node: XmlElement, result: Map<string, string>, prefix = '') {
    if (node?.type === 'element') {
        let key = (prefix.startsWith('project.properties') ? "" : prefix) + node.name;
        if (node.name && DUPLICATION_NODES.includes(node.name)) {
            DUPLICATION_NODE_CHILD_ID_NAMES.forEach(childName => {
                key = addNodeKey(node, key, childName);
            })
            if (node.name === 'mailingList') {
                key = addNodeKey(node, key, 'name');
            }
        }

        if (node.val.trim().length > 0 && !key.includes('.' + node.val)) {
            addKeyValue(result, key, node.val)
        }

        node.eachChild((child: XmlElement) => {
            xmlToProperties(child, result, `${key}.`);
        });
    }
}

function addNodeKey(node: XmlElement, key: string, childName: string) {
    const childVal = node.childNamed(childName)?.val;
    return childVal ? key + '.' + childVal : key;
}
