# Create a Start UI project

CLI tool to scaffold new Start UI projects:

- [Start UI **web**](https://github.com/BearStudio/start-ui-web)
- [Start UI **native**](https://github.com/BearStudio/start-ui-native)

## Usage

```sh
pnpm create start-ui myApp              # Prompts for project type (web/native)
pnpm create start-ui -t web myApp       # Create a start-ui-web project
pnpm create start-ui -t native myApp    # Create a start-ui-native project
```

## Options

```
Usage: create-start-ui [options] <appName>

Arguments:
  appName                Name of the app to create

Options:
  -b, --branch <branch>  Specify a branch you want to use to start
  -t, --type <type>      Type of app you want to create (web or native)
  --skip-install         Skip node modules installation step (default: false)
  --skip-git-init        Skip git init step (default: false)
  --verbose              Add additional details if something goes wrong (default: false)
  -V, --version          output the version number
  -h, --help             display help for command
```

## Project Structure

```
src/
  index.ts              # CLI entry point — parses args, orchestrates scaffolding
  lib/
    cli.ts              # Commander.js program definition
    conf.ts             # Persistent config (telemetry consent)
    debug.ts            # Conditional debug logging (--verbose)
    download.ts         # Download template tarball from GitHub
    env.ts              # Validate environment (check folder doesn't exist)
    extract.ts          # Extract tarball and copy files to project folder
    repos.ts            # GitHub repo URLs and default branches
    sentry.ts           # Error tracking (opt-in telemetry)
    spinner.ts          # CLI spinner instance
  target/
    web/index.ts        # Post-setup script for web projects
    native/index.ts     # Post-setup script for native projects (WIP)
```

## Development

1. Link the CLI globally:

```sh
pnpm link-cli
```

2. Run in watch mode (rebuilds on save):

```sh
pnpm dev
```

3. Test the CLI from any directory:

```sh
create-start-ui myApp
```

## Troubleshooting

<details>
<summary><strong>Folder already exists</strong></summary>

The CLI won't overwrite an existing folder. Remove or rename it first.
</details>

<details>
<summary><strong>Cannot download template</strong></summary>

Check your internet connection. If using `--branch`, verify the branch exists on the target GitHub repository ([web](https://github.com/BearStudio/start-ui-web) or [native](https://github.com/BearStudio/start-ui-native)).
</details>

<details>
<summary><strong>pnpm not found</strong></summary>

The CLI uses pnpm to install dependencies. Install it with `npm install -g pnpm` or use `--skip-install` and install dependencies manually.
</details>

<details>
<summary><strong>Permission errors</strong></summary>

Make sure you have write access to the target directory.
</details>
