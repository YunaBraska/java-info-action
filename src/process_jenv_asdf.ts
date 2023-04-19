import {PathOrFileDescriptor, readFileSync} from "fs";
import {listFiles, ResultType, setCommonResults} from './common_processing';

const JAVA_VERSION_PATTERN = /^(java\s+)?(\d+(\.\d+)?)/mgi;

export function runJenvAsdf(result: Map<string, ResultType>, workDir: PathOrFileDescriptor, deep: number) {
    let files = listJenvAsdfFiles(workDir, deep);
    if (files.length > 0) {
        process(files, result);
    }
}

export function listJenvAsdfFiles(workDir: PathOrFileDescriptor, deep: number): PathOrFileDescriptor[] {
    return listFiles(workDir, deep, '^(\\.java.version|\\.tool.versions)$', [], 0);
}

function process(jenvAsdfFiles: PathOrFileDescriptor[], result: Map<string, ResultType>): Map<string, ResultType> {
    for (const file of jenvAsdfFiles) {
        try {
            const match = readFileSync(file, "utf8")?.trim()?.match(JAVA_VERSION_PATTERN);
            if (match) {
                let propertyMap = new Map<string, string>();
                propertyMap.set('java_version', match[match.length -1].replace('java', '').trim())
                setCommonResults(result, propertyMap);
            }
        } catch (err) {
            console.error(`Error reading file '${file}':`, err);
        }
    }
    return result;
}
