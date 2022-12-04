# java-version

Reads out the java version from gradle or maven.

It also creates some pre-generated commends dependent on wrapper, and OS. e.g. gradle, gradlew, gradle.bat

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
- name: "Get Java Version"
  id: "read_java"
  uses: actions/java-version@main
  with:
    deep: '-1'
    work-dir: '.'
- name: "Print Java Version"
  run: echo "java_version [${{ steps.read_java.outputs.java_version }}]"
- name: "Setup Java"
  uses: actions/setup-java@main
  with:
    java-version: ${{ steps.read_java.outputs.java_version }}
    distribution: 'adopt'
```

### Inputs

| parameter | default | description                      |
|-----------|---------|----------------------------------|
| work-dir  | '.'     | folder scan ('.' == current)     |
| deep      | -1      | folder scan deep (-1 == endless) |

### Outputs

| Name               | default      | description                                                                                          |
|--------------------|--------------|------------------------------------------------------------------------------------------------------|
| java_version       | <Latest_LTS> | java version - parsed from build files                                                               |
| has_wrapper        | false        | if a wrapper exists - e.g. gradlew, mvnw,...                                                         |
| builder_version    | null         | version of the wrapper                                                                               |
| is_gradle          | false        | true if a gradle build was found                                                                     |
| is_maven           | false        | true if a maven build was found                                                                      |
| cmd                | -            | build command e.g. gradle, gradlew, gradle.bat, mvn, mvnw, mvn.bat                                   |
| cmd_test           | -            | build command e.g. gradle, gradlew, gradle.bat, mvn, mvnw, mvn.bat                                   |
| cmd_build          | -            | test command e.g. gradle clean build -x test / maven clean package -DskipTests                       |
| cmd_test_build     | -            | test command e.g. gradle clean build / maven clean package                                           |
| cmd_update_deps    | -            | test command e.g. gradle check / maven versions:use-latest-versions -B -q -DgenerateBackupPoms=false |
| cmd_update_plugs   | -            | test command e.g. gradle check / maven versions:use-latest-versions -B -q -DgenerateBackupPoms=false |
| cmd_update_props   | -            | test command e.g. gradle check / maven versions:update-properties -B -q -DgenerateBackupPoms=false   |
| cmd_update_parent  | -            | test command e.g. gradle check / maven versions:update-parent -B -q -DgenerateBackupPoms=false       |
| cmd_update_wrapper | -            | test command e.g. gradle wrapper --gradle-version 7.5.1 / maven -B -q -N io.takari:maven:wrapper     |

### \[DEV] Setup Environment

* `npm install`
* NodeJs 16: do not upgrade nodeJs as GitHub actions latest version is 16
* Hint: please do not remove the node modules as they are required for custom GitHub actions :(

## TODO

* [x] Setup test environment
* [x] Publish
* [x] Test Pipeline
* [x] Deploy Pipeline
  audit fix, npm update --save, ..)
* [x] Gradle
    * [ ] Update latest gradle
    * [ ] Update latest java version
    * [ ] Parse encoding
* [ ] Maven
* [ ] Move to typescript

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
