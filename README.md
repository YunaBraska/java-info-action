# java-info-action

Fast Maven/Gradle parser - reads properties (e.g. java version) and provides independent build commands (e.g. gradle,
gradlew, gradle.bat, mvn, mvnw, mvnw.bat).

*Does not use any maven / gradle commands*

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/donate/?hosted_button_id=HFHFUT3G6TZF6)

[![Build][build_shield]][build_link]
[![Maintainable][maintainable_shield]][maintainable_link]
[![Coverage][coverage_shield]][coverage_link]
[![Issues][issues_shield]][issues_link]
[![Commit][commit_shield]][commit_link]
[![License][license_shield]][license_link]
[![Tag][tag_shield]][tag_link]
[![Size][size_shield]][size_shield]
![Label][label_shield]
![Label][node_version]

## Usage

```yaml
# RUNNER
- name: "Read Java Info"
  id: "java_info"
  uses: YunaBraska/java-info-action@main

  # CONFIGS (Optional)
  with:
    deep: '-1'
    work-dir: '.'
    jv-fallback: 17
    pv-fallback: '0.0.1'
    pe-fallback: 'utf-8'

  # PRINT
- name: "Print Java Version"
  run: |
    echo "java_version [${{ steps.java_info.outputs.java_version }}]"
    echo "artifact_name [${{ steps.java_info.outputs.artifact_name }}]"
    echo "project_version [${{ steps.java_info.outputs.project_version }}]"
    echo "project_encoding [${{ steps.java_info.outputs.project_encoding }}]"
    echo "is_gradle [${{ steps.java_info.outputs.is_gradle }}]"
    echo "is_maven [${{ steps.java_info.outputs.is_maven }}]"
    echo "has_wrapper [${{ steps.java_info.outputs.has_wrapper }}]"
    echo "x_sourceCompatibility [${{ steps.java_info.outputs.x_sourceCompatibility }}]"
    echo "x_project_build_finalName [${{ steps.java_info.outputs.x_project_build_finalName }}]"
    echo "x_groovyOptions_encoding [${{ steps.java_info.outputs.x_groovyOptions_encoding }}]"
    echo "x_net_minidev_json-smart_version [${{ steps.java_info.outputs.x_project_dependencies_dependency_net_minidev_json-smart_version }}]"

  # SETUP JAVA
- name: "Setup Java"
  uses: actions/setup-java@main
  with:
    java-version: ${{ steps.java_info.outputs.java_version }}
    distribution: 'adopt'

  # RUN TESTS
- name: "Run tests"
  run: sh ${{ steps.java_info.outputs.cmd_test }}

```

* Hint for multi-modules: The highest java version will win the race.

### Inputs

| parameter   | default      | description                                                      |
|-------------|--------------|------------------------------------------------------------------|
| work-dir    | '.'          | folder scan ('.' == current)                                     |
| deep        | -1           | folder scan deep (-1 == endless)                                 |
| jv-fallback | <Latest_LTS> | fallback for "java_version" if no java version was found         |
| pv-fallback | null         | fallback for "project_version" if no project version was found   |
| pe-fallback | utf-8        | fallback for "project_encoding" if no project encoding was found |

### Outputs

| Name                | default      | description                                                                                                                 |
|---------------------|--------------|-----------------------------------------------------------------------------------------------------------------------------|
| java_version        | <Latest_LTS> | java version - parsed from build files e.g. 6,7,8,9,10,11                                                                   |
| java_version_legacy | <Latest_LTS> | java version - parsed from build files e.g. 1.6,1.7,1.8,1.9,10,11                                                           |
| project_version     | null         | project version - parsed from build files e.g. 1.2.3                                                                        |
| project_encoding    | null         | project encoding - parsed from build files e.g. utf-8                                                                       |
| has_wrapper         | false        | if a wrapper exists - e.g. gradlew, mvnw,...                                                                                |
| builder_version     | null         | version of the wrapper                                                                                                      |
| is_gradle           | false        | true if a gradle build file was found                                                                                       |
| is_maven            | false        | true if a maven build file was found                                                                                        |
| artifact_name       | -            | artifact name if defined e.g. "archiveFileName, baseName, finalName"                                                        |
| artifact_name_jar   | -            | artifact name ending with ".jar" if defined e.g. "archiveFileName, baseName, finalName"                                     |
| cmd                 | -            | command e.g. <br>*  gradle / gradlew / gradle.bat <br>*  mvn / mvnw / mvn.bat                                               |
| cmd_test            | -            | command e.g. <br>*  gradle clean test <br>*  mvn clean test                                                                 |
| cmd_build           | -            | command e.g. <br>*  gradle clean build -x test  <br>*  mvn clean package -DskipTests                                        |
| cmd_test_build      | -            | command e.g. <br>*  gradle clean build  <br>*  mvn clean package                                                            |
| cmd_update_deps     | -            | command e.g. <br>*  gradle check  <br>*  mvn versions:use-latest-versions -B -q -DgenerateBackupPoms=false                  |
| cmd_update_plugs    | -            | command e.g. <br>*  gradle check  <br>*  mvn versions:use-latest-versions -B -q -DgenerateBackupPoms=false                  |
| cmd_update_props    | -            | command e.g. <br>*  gradle check  <br>*  mvn versions:update-properties -B -q -DgenerateBackupPoms=false                    |
| cmd_update_parent   | -            | command e.g. <br>*  gradle check  <br>*  mvn versions:update-parent -B -q -DgenerateBackupPoms=false                        |
| cmd_resolve_deps    | -            | command e.g. <br>*  gradle check  <br>*  mvn -B -q dependency:resolve -Dmaven.test.skip=true                                |
| cmd_resolve_plugs   | -            | command e.g. <br> *  gradle --refresh-dependencies check -x test <br>*  mvn -B -q dependency:resolve -Dmaven.test.skip=true |
| cmd_update_wrapper  | -            | command  <br>*  gradle wrapper --gradle-version \<Latest_LTS>  <br>*  mvn -B -q -N io.takari:maven:wrapper                  |
| x_\<propertyKey>    | -            | other unhandled build script properties. These differs between maven an gradle                                              |

### \[DEV] Setup Environment

* clean environment: `./clean_node.sh`
* Build: `npm run build` to "compile" `index.ts` to `./lib/index.js`
* Test: `npm run test:coverage`
* NodeJs 16: do not upgrade nodeJs as GitHub actions latest version is 16
* Hint: please do not remove the node modules as they are required for custom GitHub actions :(

[build_shield]: https://github.com/YunaBraska/java-info-action/workflows/RELEASE/badge.svg

[build_link]: https://github.com/YunaBraska/java-info-action/actions/workflows/publish.yml/badge.svg

[maintainable_shield]: https://img.shields.io/codeclimate/maintainability/YunaBraska/java-info-action?style=flat-square

[maintainable_link]: https://codeclimate.com/github/YunaBraska/java-info-action/maintainability

[coverage_shield]: https://img.shields.io/codeclimate/coverage/YunaBraska/java-info-action?style=flat-square

[coverage_link]: https://codeclimate.com/github/YunaBraska/java-info-action/test_coverage

[issues_shield]: https://img.shields.io/github/issues/YunaBraska/java-info-action?style=flat-square

[issues_link]: https://github.com/YunaBraska/java-info-action/commits/main

[commit_shield]: https://img.shields.io/github/last-commit/YunaBraska/java-info-action?style=flat-square

[commit_link]: https://github.com/YunaBraska/java-info-action/issues

[license_shield]: https://img.shields.io/github/license/YunaBraska/java-info-action?style=flat-square

[license_link]: https://github.com/YunaBraska/java-info-action/blob/main/LICENSE

[tag_shield]: https://img.shields.io/github/v/tag/YunaBraska/java-info-action?style=flat-square

[tag_link]: https://github.com/YunaBraska/java-info-action/releases

[size_shield]: https://img.shields.io/github/repo-size/YunaBraska/java-info-action?style=flat-square

[label_shield]: https://img.shields.io/badge/Yuna-QueenInside-blueviolet?style=flat-square

[gitter_shield]: https://img.shields.io/gitter/room/YunaBraska/java-info-action?style=flat-square

[gitter_link]: https://gitter.im/java-info-action/Lobby

[node_version]: https://img.shields.io/badge/node-16-blueviolet?style=flat-square
