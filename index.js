#!/usr/bin/env node
import chalk from 'chalk';

import path from 'node:path';

import cli from './app/config/cli.js';
import { generate } from './app/generate.js';
import init from './app/init.js';
import log from './app/log.js';

const input = cli.input;
const flags = cli.flags;
const { debug, help } = flags;

const errorLog = chalk.bgRed;

(async () => {
  await init();
  help && cli.showHelp(0);
  debug && log(flags);

  if (flags.web && flags.native) {
    console.log(errorLog('Only one target can be chosen.'));
    process.exit(1);
  }

  let target = null;
  if (flags.native) target = 'native';
  else target = 'web';

  // Get the project name (should be the first argument)
  const [projectName] = input;
  if (!projectName) {
    cli.showHelp(0);
  }

  const projectDirectory = path.resolve(process.cwd(), projectName);
  await generate({ projectName, outDirPath: projectDirectory, target });
})();
