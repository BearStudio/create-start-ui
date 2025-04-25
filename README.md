# Create a 🚀 Start UI project

## Usage

Generate a 🚀 Start UI project in a new folder.

```sh
pnpm create start-ui <projectName>    # Generate a start-ui-web project
pnpm create start-ui -t native <projectName> # Generate a start-ui-native project
```

## Options

```sh
Usage: create-start-ui [options] <appName>

Arguments:
  appName                Name of the app to create

Options:
  -b, --branch <branch>  Specify a branch you want to use to start
  -t, --type <type>      Type of app you want to create
  --skip-install         Skip node modules installation step (default: false)
  --skip-git-init        Skip git init step (default: false)
  --verbose              Add additional details if something goes wrong (default: false)
  -V, --version          output the version number
  -h, --help             display help for command
```

## Development

1. Link the repository to your system with the following command:

```sh
pnpm link-cli
```

2. Run dev command to have the cli be rebuilt on each save:

```sh
pnpm dev
```

3. Run the cli in any directory, it will reflect any changes you have made:

```sh
create-start-ui myApp
```
