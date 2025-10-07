# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a GitHub Action called `java-info-action` that parses Maven/Gradle build files to extract Java project information without requiring Java, Maven, or Gradle to be installed. It analyzes build files directly and outputs project metadata like Java version, project version, encoding, and build commands.

## Build and Development Commands

### Core Development Commands
- **Build**: `npm run build` - Compiles TypeScript, packages with ncc, and generates licenses.csv
- **Test**: `npm run test` - Runs build and Jest tests with coverage
- **Package**: `npm run package` - Packages the code using ncc for GitHub Actions distribution
- **Clean**: `./clean_node.sh` - Cleans the node environment

### Testing Specific Files
- Run all tests: `npm test`
- Tests are located in `test/index.test.ts`
- Test resources are in `test/resources/` with sample Maven/Gradle projects

## Architecture Overview

### Core Processing Flow
The action follows a multi-stage processing pipeline:

1. **Input Processing** (`src/index.ts`): Entry point that reads GitHub Action inputs and orchestrates the parsing
2. **File Discovery**: Uses `listFiles()` from `common_processing.ts` to recursively find build files
3. **Parser Execution**: Runs specialized parsers in sequence:
   - `runJenvAsdf()` - Parses `.java-version` and `.tool-versions` files
   - `runMaven()` - Processes `pom*.xml` files using XML parsing
   - `runGradle()` - Processes `build.gradle*` files using custom property parsing
4. **Result Processing**: Consolidates results, applies fallbacks, and formats outputs

### Key Components

#### `src/common_processing.ts`
- **Core utilities and shared logic**
- `setCommonResults()`: Main processing function that extracts Java version, project version, artifact names, and encoding
- `listFiles()`: Recursive file discovery with depth control
- Property resolution system for handling Maven/Gradle variable substitution
- Constants for property name mappings (Java version, encoding, artifact names)

#### `src/process_maven.ts`
- **Maven POM XML parser**
- Uses `xmldoc` library to parse XML structure
- `xmlToProperties()`: Converts XML hierarchy to flat property map
- Handles Maven-specific features like dependency scopes, plugin configurations
- Special handling for duplicate nodes (dependencies, plugins) with unique keys

#### `src/process_gradle.ts`
- **Gradle build file parser**
- Custom parser for both Groovy and Kotlin DSL formats
- `readPropertiesGradle()`: Extracts key-value pairs from build files
- Handles Gradle-specific syntax like `.set()` methods and variable definitions
- Wrapper detection and version extraction

#### `src/process_jenv_asdf.ts`
- **Tool version file parser**
- Supports JENV (`.java-version`) and ASDF (`.tool-versions`) version managers
- Provides fallback Java version detection

#### `src/badges_shield_updater.ts`
- **Shield badge updater utility**
- Updates project badges/shields based on extracted information

### Data Flow Architecture

1. **Property Extraction**: Each parser extracts properties into a `Map<string, string>`
2. **Property Resolution**: Variables and references are resolved using `resolvePropertyMap()`
3. **Common Processing**: `setCommonResults()` applies standard extraction rules:
   - Java version from `JAVA_VERSION_PROPS` (supports multiple formats)
   - Project version from `project.version` properties
   - Artifact names from `ARTIFACT_NAME_PROPS`
   - Encoding from `PROJECT_ENCODING_PROPS`
4. **Command Generation**: Build commands are generated based on detected wrapper files and platform
5. **Output Formatting**: Results are converted to GitHub Actions outputs

### Key Design Patterns

- **Property Mapping**: Uses arrays of property names to handle different naming conventions
- **Highest Version Wins**: When multiple Java versions are found, the highest one is selected
- **Wrapper Detection**: Automatically detects and prefers wrapper scripts (gradlew, mvnw)
- **Platform-Aware Commands**: Generates appropriate commands for Windows vs Unix platforms
- **Fallback System**: Provides defaults for Java version, project version, and encoding

## Important Implementation Details

### Java Version Resolution
The system handles multiple Java version formats:
- Modern versions: 11, 17, 21
- Legacy versions: 1.8, 1.7 (converted to 8, 7)
- Version extraction from various property names across Maven and Gradle

### Build Tool Detection
- **Maven**: Looks for `pom*.xml` files
- **Gradle**: Looks for `build.gradle*` files
- **Wrapper Priority**: Prefers wrapper scripts when available
- **Multi-module Support**: Processes all build files in directory tree

### Property Resolution System
- Maven: Handles `${property.name}` variable substitution
- Gradle: Handles both direct property assignment and `.set()` method calls
- Duplicate handling: Uses `#1`, `#2` suffixes for multiple occurrences

### Testing Strategy
- Comprehensive test suite with real Maven/Gradle project structures
- Tests organized by tool type (Maven/Gradle) and feature
- Uses file path conventions to derive expected results (e.g., `java_17` in path expects version 17)
- Tests wrapper detection, version extraction, and command generation

## Node.js Version
The project uses Node.js 20 and is configured as a GitHub Action that runs on `node20`.