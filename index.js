#!/usr/bin/env node
const path = require('path');

const init = require('./utils/init');
const cli = require('./utils/cli');
const log = require('./utils/log');
const chalk = require('chalk');
const { generate, targets } = require('./utils/generate');

const input = cli.input;
const flags = cli.flags;
const { debug } = flags;

const errorLog = chalk.bgRed;

(async () => {
  init();
  input.includes('help') && cli.showHelp(0);
  debug && log(flags);

  if (flags.web && flags.native) {
    console.log(errorLog('Only one target can be chosen.'));
    process.exit(1);
  }

  if (flags.native) target = 'native';
  else target = 'web';

  // Get the project name (should be the first argument)
  const [projectName] = input;
  if (!projectName) {
    console.log(errorLog('No project name. Please specify a project name'));
    process.exit(1);
  }

  const projectDirectory = path.resolve(process.cwd(), projectName);
  await generate({ outDirPath: projectDirectory, target });
})();
