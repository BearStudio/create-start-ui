# Create a 🚀 Start UI project

## Usage

Generate a 🚀 Start UI project in a new folder.

```bash
yarn create start-ui --web [projectName]    # Generate a start-ui-web project
yarn create start-ui --native [projectName] # Generate a start-ui-native project
```

## Options

```
-h, --help              Show this help
-v, --version           Display CLI version
--web PROJECT_PATH      Scaffold a brand new StartUI [Web] project
--native PROJECT_PATH   Scaffold a brand new StartUI [Native] project
--branch BRANCH_NAME    Specify the git branch used to clone the project
--no-git-init           Ignore `git init` step
--no-package-install    Ignore node packages install step
```

## Examples

```bash
# Create a new web project
yarn create start-ui --web my-web-project

# Skip git repo initialization
yarn create start-ui --web --no-git-init my-web-project
```

## Development

1. Link the repository to your system with the following command:

```bash
yarn link
```

2. Test your local package in any directory:

```bash
yarn create start-ui --web [projectName]
```

3. After testing, remove the linked repository:

```bash
yarn unlink
```
