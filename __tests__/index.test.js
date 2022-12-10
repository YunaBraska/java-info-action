const main = require('../index')
const path = require('path');
const fs = require('fs');

// ########## GRADLE ##########

test('[GRADLE] Read empty dir', () => {
    let dir = path.join(__dirname, 'resources/gradle/empty');
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    let result = main.run(dir, -1, 17);
    expect(result['java_version']).toEqual(17)
    expect(result['is_gradle']).toEqual(false)
    expect(result['is_maven']).toEqual(false)
    expect(result['has_wrapper']).toEqual(false)
    expect(result['builder_version']).toEqual(null)
    expect(result['cmd']).toEqual(null)
});

test('[GRADLE] Read highest Java Version should be 17', () => {
    let result_src = main.run(path.join(__dirname, 'resources/gradle/source'), -1);
    expect(result_src['java_version']).toEqual(17)
    expect(result_src['is_gradle']).toEqual(true)
    expect(result_src['is_maven']).toEqual(false)
    expect(result_src['has_wrapper']).toEqual(true)
    expect(result_src['builder_version']).toEqual('7.5')
    expect(result_src['cmd']).toEqual(process.platform === "win32" ? 'gradle.bat' : './gradlew')

    let result_lv = main.run(path.join(__dirname, 'resources/gradle/language_version'), -1);
    expect(result_lv['java_version']).toEqual(17)
    expect(result_lv['is_gradle']).toEqual(true)
    expect(result_lv['is_maven']).toEqual(false)
    expect(result_lv['has_wrapper']).toEqual(true)
    expect(result_lv['builder_version']).toEqual('7.5')
    expect(result_lv['cmd']).toEqual(process.platform === "win32" ? 'gradle.bat' : './gradlew')
});

test('[GRADLE] Read highest Java Version with deep limit 1 should be 11', () => {
    let result_src = main.run(path.join(__dirname, 'resources/gradle'), 1);
    expect(result_src['java_version']).toEqual(11)
    expect(result_src['is_gradle']).toEqual(true)
    expect(result_src['is_maven']).toEqual(false)
    expect(result_src['has_wrapper']).toEqual(false)
    expect(result_src['builder_version']).toEqual(null)
    expect(result_src['cmd']).toEqual('gradle')

    let result_lv = main.run(path.join(__dirname, 'resources/gradle/language_version'), 1);
    expect(result_lv['java_version']).toEqual(11)
    expect(result_lv['is_gradle']).toEqual(true)
    expect(result_lv['is_maven']).toEqual(false)
    expect(result_lv['has_wrapper']).toEqual(false)
    expect(result_lv['builder_version']).toEqual(null)
    expect(result_lv['cmd']).toEqual('gradle')
});

test('[GRADLE] Read each file should have expected result', () => {
    main.listGradleFiles(path.dirname(__filename), -1).forEach(file => {
        let dir = path.dirname(file);
        let result = main.run(dir, 1);

        let hasWrapper = dir.includes('wrapper');
        let expectedVersion = javaVersionOfPath(dir);
        expect(result['java_version']).toEqual(expectedVersion)
        expect(result['java_version_legacy']).toEqual(expectedVersion === 8 ? '1.8' : expectedVersion.toString())
        expect(result['has_wrapper']).toEqual(hasWrapper)
        expect(result['is_gradle']).toEqual(true)
        expect(result['is_maven']).toEqual(false)
        expect(result['builder_version']).toEqual(hasWrapper ? '7.5' : null)
        expect(result['cmd']).toEqual(hasWrapper ? (process.platform === "win32" ? 'gradle.bat' : './gradlew') : 'gradle')
    });
});

// ########## MAVEN ##########

test('[MAVEN] Read empty dir', () => {
    let dir = path.join(__dirname, 'resources/maven/empty');
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    let result = main.run(dir, -1, 17);
    expect(result['java_version']).toEqual(17)
    expect(result['is_gradle']).toEqual(false)
    expect(result['is_maven']).toEqual(false)
    expect(result['has_wrapper']).toEqual(false)
    expect(result['builder_version']).toEqual(null)
    expect(result['cmd']).toEqual(null)
});

test('[MAVEN] Read highest Java Version should be 17', () => {
    let result_src = main.run(path.join(__dirname, 'resources/maven'), -1);
    expect(result_src['java_version']).toEqual(17)
    expect(result_src['is_maven']).toEqual(true)
    expect(result_src['has_wrapper']).toEqual(true)
    expect(result_src['builder_version']).toEqual('3.6.3')
    expect(result_src['cmd']).toEqual(process.platform === "win32" ? 'mvnw.cmd' : './mvnw')
});

test('[MAVEN] Read highest Java Version with deep limit 1 should be 11', () => {
    let result_source = main.run(path.join(__dirname, 'resources/maven/m_release'), 1);
    expect(result_source['java_version']).toEqual(11)
    expect(result_source['is_maven']).toEqual(true)
    expect(result_source['has_wrapper']).toEqual(false)
    expect(result_source['builder_version']).toEqual(null)
    expect(result_source['cmd']).toEqual('mvn')

    let result_target = main.run(path.join(__dirname, 'resources/maven/m_release'), 1);
    expect(result_target['java_version']).toEqual(11)
    expect(result_target['is_maven']).toEqual(true)
    expect(result_target['has_wrapper']).toEqual(false)
    expect(result_target['builder_version']).toEqual(null)
    expect(result_target['cmd']).toEqual('mvn')

    let result_release = main.run(path.join(__dirname, 'resources/maven/m_release'), 1);
    expect(result_release['java_version']).toEqual(11)
    expect(result_release['is_maven']).toEqual(true)
    expect(result_release['has_wrapper']).toEqual(false)
    expect(result_release['builder_version']).toEqual(null)
    expect(result_release['cmd']).toEqual('mvn')
});

test('[MAVEN] Read each file should have expected result', () => {
    main.listMavenFiles(path.dirname(__filename), -1).forEach(file => {
        let dir = path.dirname(file);
        let result = main.run(dir, 1);

        let hasWrapper = dir.includes('wrapper');
        let expectedVersion = javaVersionOfPath(dir);
        expect(result['java_version']).toEqual(expectedVersion)
        expect(result['java_version_legacy']).toEqual(expectedVersion === 8 ? '1.8' : expectedVersion.toString())
        expect(result['has_wrapper']).toEqual(hasWrapper)
        expect(result['is_maven']).toEqual(true)
        expect(result['builder_version']).toEqual(hasWrapper ? '3.6.3' : null)
        expect(result['cmd']).toEqual(hasWrapper ? (process.platform === "win32" ? 'mvnw.cmd' : './mvnw') : 'mvn')
    });
});

function javaVersionOfPath(pathString) {
    let jv = pathString.substring(pathString.lastIndexOf('\\') + 1);
    jv = jv.substring(jv.lastIndexOf('/') + 1);
    jv = jv.substring(jv.lastIndexOf('_') + 1);
    return parseInt(jv.trim())
}



