# java-version

Reads out the java version from gradle or maven

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
* [ ] Deploy Pipeline
  audit fix, npm update --save, ..)
* [x] Gradle
    * [ ] Update latest gradle
    * [ ] Update latest java version
    * [ ] Parse encoding
* [ ] Maven
* [ ] Move to typescript

