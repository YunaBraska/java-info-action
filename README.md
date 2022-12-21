# java-version

Reads out the java version from gradle or maven.

This is a parser, it won't run any gradle/maven command as these commands are really expensive in time and requirements.

It also creates some pre-generated commends dependent on the build tool and OS. e.g. gradle, gradlew, gradle.bat

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/donate/?hosted_button_id=HFHFUT3G6TZF6)

[![Build][build_shield]][build_link]
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
- name: "Get Java Version"
  id: "java_version_reader"
  uses: YunaBraska/java-version@main

  # CONFIGS
  with:
    deep: '-1'
    work-dir: '.'
    jv-fallback: 17
    pv-fallback: '0.0.1'

  # PRINT
- name: "Print Java Version"
  run: echo "java_version [${{ steps.java_version_reader.outputs.java_version }}]"
  # SETUP JAVA
- name: "Setup Java"
  uses: actions/setup-java@main
  with:
    java-version: ${{ steps.java_version_reader.outputs.java_version }}
    distribution: 'adopt'
```

* Hint for multi-modules: The highest java version will win the race.

### Inputs

| parameter   | default      | description                                                    |
|-------------|--------------|----------------------------------------------------------------|
| work-dir    | '.'          | folder scan ('.' == current)                                   |
| deep        | -1           | folder scan deep (-1 == endless)                               |
| jv-fallback | <Latest_LTS> | fallback for "java_version" if no java version was found       |
| pv-fallback | null         | fallback for "project_version" if no project version was found |

### Outputs

| Name                | default      | description                                                                                   |
|---------------------|--------------|-----------------------------------------------------------------------------------------------|
| project_version     | null         | project version - parsed from build files e.g. 1.2.3                                          |
| java_version        | <Latest_LTS> | java version - parsed from build files e.g. 6,7,8,9,10,11                                     |
| java_version_legacy | <Latest_LTS> | java version - parsed from build files e.g. 1.6,1.7,1.8,1.9,10,11                             |
| has_wrapper         | false        | if a wrapper exists - e.g. gradlew, mvnw,...                                                  |
| builder_version     | null         | version of the wrapper                                                                        |
| is_gradle           | false        | true if a gradle build file was found                                                         |
| is_maven            | false        | true if a maven build file was found                                                          |
| cmd                 | -            | command e.g. gradle, gradlew, gradle.bat, mvn, mvnw, mvn.bat                                  |
| cmd_test            | -            | command e.g. gradle clean test, clean test                                                    |
| cmd_build           | -            | command e.g. gradle clean build -x test / mvn clean package -DskipTests                       |
| cmd_test_build      | -            | command e.g. gradle clean build / mvn clean package                                           |
| cmd_update_deps     | -            | command e.g. gradle check / mvn versions:use-latest-versions -B -q -DgenerateBackupPoms=false |
| cmd_update_plugs    | -            | command e.g. gradle check / mvn versions:use-latest-versions -B -q -DgenerateBackupPoms=false |
| cmd_update_props    | -            | command e.g. gradle check / mvn versions:update-properties -B -q -DgenerateBackupPoms=false   |
| cmd_update_parent   | -            | command e.g. gradle check / mvn versions:update-parent -B -q -DgenerateBackupPoms=false       |
| cmd_update_wrapper  | -            | command e.g. gradle wrapper --gradle-version 7.5.1 / mvn -B -q -N io.takari:maven:wrapper     |

### \[DEV] Setup Environment

* setup or clean environment `./clean_node.sh`
* Run `tsc` to "compile" `index.ts` to `./lib/index.js`
* NodeJs 16: do not upgrade nodeJs as GitHub actions latest version is 16
* Hint: please do not remove the node modules as they are required for custom GitHub actions :(

[build_shield]: https://github.com/YunaBraska/java-version/workflows/RELEASE/badge.svg

[build_link]: https://github.com/YunaBraska/java-version/actions?query=workflow%3AMVN_RELEASE

[issues_shield]: https://img.shields.io/github/issues/YunaBraska/java-version?style=flat-square

[issues_link]: https://github.com/YunaBraska/java-version/commits/main

[commit_shield]: https://img.shields.io/github/last-commit/YunaBraska/java-version?style=flat-square

[commit_link]: https://github.com/YunaBraska/java-version/issues

[license_shield]: https://img.shields.io/github/license/YunaBraska/java-version?style=flat-square

[license_link]: https://github.com/YunaBraska/java-version/blob/main/LICENSE

[tag_shield]: https://img.shields.io/github/v/tag/YunaBraska/java-version?style=flat-square

[tag_link]: https://github.com/YunaBraska/java-version/releases

[size_shield]: https://img.shields.io/github/repo-size/YunaBraska/java-version?style=flat-square

[label_shield]: https://img.shields.io/badge/Yuna-QueenInside-blueviolet?style=flat-square

[gitter_shield]: https://img.shields.io/gitter/room/YunaBraska/java-version?style=flat-square

[gitter_link]: https://gitter.im/java-version/Lobby

[node_version]: https://img.shields.io/badge/node-16-blueviolet?style=flat-square
