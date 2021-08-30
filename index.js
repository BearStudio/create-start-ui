#!/usr/bin/env node
const path = require('path');

const init = require('./utils/init');
const cli = require('./utils/cli');
const log = require('./utils/log');
const chalk = require('chalk');
const generate = require('./utils/generate');

const input = cli.input;
const flags = cli.flags;
const { debug, target } = flags;

const targets = {
  web: 'git@github.com:BearStudio/start-ui.git',
  native: 'git@github.com:BearStudio/start-ui-native.git',
};

const errorLog = chalk.bgRed;

(async () => {
  init();
  input.includes('help') && cli.showHelp(0);
  debug && log(flags);

  // Check that the target is a valid one
  const validTargetNames = Object.keys(targets);
  if (!validTargetNames.includes(target)) {
    console.log(errorLog(`Invalid target. Valid targets are:`));
    validTargetNames.forEach((targetName) => console.log(` - ${targetName}`));
    process.exit(1);
  }

  // Get the project name (should be the first argument)
  const [projectName] = input;
  if (!projectName) {
    console.log(errorLog('No project name. Please specify a project name'));
    process.exit(1);
  }

  const projectDirectory = path.resolve(process.cwd(), projectName);
  await generate({ outDirPath: projectDirectory });
})();
