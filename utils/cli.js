const meow = require('meow');
const chalk = require('chalk');
const terminalLink = require('terminal-link');

const flags = {
  version: {
    type: 'boolean',
    alias: 'v',
  },
  web: {
    type: 'boolean',
    default: false,
  },
  native: {
    type: 'boolean',
    default: false,
  },
  gitInit: {
    type: 'boolean',
    default: true,
  },
  help: {
    type: 'boolean',
    alias: ['h'],
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
    -h, --help              Show this help
    -v, --version           Display CLI version
    --web ${bold.underline(
      'PROJECT_PATH'
    )}      Scaffold a brand new ${startUiWebLink} project
    --native ${bold.underline(
      'PROJECT_PATH'
    )}   Scaffold a brand new ${startUiNativeLink} project
    --no-git-init           Ignore ${chalk.dim('`git init`')} step

  ${bold('Examples')}
    ${chalk.cyan.bold('Create a new web project')}
    $ ${chalk.dim('create-start-ui --web my-web-project')}

    ${chalk.cyan.bold('Skip git repo initialization')}
    $ ${chalk.dim('create-start-ui --web --no-git-init my-web-project')}
`;

const options = {
  inferType: true,
  description: false,
  hardRejection: false,
  autoHelp: false,
  flags,
};

module.exports = meow(helpText, options);
