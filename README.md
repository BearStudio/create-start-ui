# Create a 🚀 Start UI project

## Usage

Generate a 🚀 Start UI project in a new folder.

```bash
npx create-start-ui --web [projectName]    # Generate a start-ui-web project
npx create-start-ui --native [projectName] # Generate a start-ui-native project
```

## Options

```
-h, --help              Show this help
-v, --version           Display CLI version
--web PROJECT_PATH      Scaffold a brand new StartUI [Web] project
--native PROJECT_PATH   Scaffold a brand new StartUI [Native] project
--no-git-init           Ignore `git init` step
```


## Examples

```bash
# Create a new web project
npx create-start-ui --web my-web-project

# Skip git repo initialization
npx create-start-ui --web --no-git-init my-web-project
```