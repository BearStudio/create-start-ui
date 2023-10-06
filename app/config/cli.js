import chalk from 'chalk';
import meow from 'meow';
import terminalLink from 'terminal-link';

const flags = {
  version: {
    type: 'boolean',
    shortFlag: 'v',
  },
  web: {
    type: 'boolean',
    default: false,
  },
  native: {
    type: 'boolean',
    default: false,
  },
  branch: {
    type: 'string',
    default: 'master',
    shortFlag: 'b',
  },
  packageInstall: {
    type: 'boolean',
    default: true,
  },
  gitInit: {
    type: 'boolean',
    default: true,
  },
  help: {
    type: 'boolean',
    shortFlag: ['h'],
    default: false,
  },
};

const bold = chalk.bold;
const startUiNativeLink = terminalLink(
  'StartUI [Native]',
  'https://github.com/BearStudio/start-ui-native',
  { fallback: () => 'StartUI [Native]' }
);
const startUiWebLink = terminalLink(
  'StartUI [Web]',
  'https://github.com/BearStudio/start-ui-web',
  { fallback: () => 'StartUI [Web]' }
);
const helpText = `
  ${bold('Usage')}
    $ create-start-ui <target> <projectPath>

  ${bold('Options')}
    -h, --help                        Show this help
    -v, --version                     Display CLI version
    -b, --branch ${bold.underline('BRANCH_NAME')}  ${chalk.dim.italic(
      'master'
    )}  Specify the branch used to clone the project
    --web                     ${chalk.dim.italic(
      'true'
    )}    Scaffold a brand new ${startUiWebLink} project
    --native                  ${chalk.dim.italic(
      'false'
    )}   Scaffold a brand new ${startUiNativeLink} project
    --no-package-install      ${chalk.dim.italic(
      'false'
    )}   Ignore node packages install step
    --no-git-init             ${chalk.dim.italic('false')}   Ignore ${chalk.dim(
      '`git init`'
    )} step

  ${bold('Examples')}
    ${chalk.cyan.bold('Create a new web project')}
    $ ${chalk.dim('create-start-ui --web my-web-project')}

    ${chalk.cyan.bold('Skip git repo initialization')}
    $ ${chalk.dim('create-start-ui --web --no-git-init my-web-project')}

    ${chalk.cyan.bold('Specify a branch to use to create the project')}
    $ ${chalk.dim('create-start-ui --web --branch with-auth my-web-project')}
`;

const options = {
  inferType: true,
  description: false,
  hardRejection: false,
  autoHelp: false,
  flags,
  importMeta: import.meta,
};

export default meow(helpText, options);
