import { Command } from 'commander';

import type { Target } from '@/lib/repos.js';

import packageJson from '../../package.json' with { type: 'json' };

const isTarget = (value: string): value is Target => {
  return ['web', 'native'].includes(value);
};

const parseTarget = (value: string): Target => {
  if (!isTarget(value)) {
    console.error(`Invalid project type: "${value}". Must be "web" or "native".`);
    process.exit(1);
  }
  return value;
};

export const program = new Command()
  .name(packageJson.name)
  .argument('<appName>', 'Name of the app to create')
  .option('-b, --branch <branch>', 'Specify a branch you want to use to start')
  .option('-t, --type <type>', 'Type of app you want to create', parseTarget)
  .option('--skip-install', 'Skip node modules installation step', false)
  .option('--skip-git-init', 'Skip git init step', false)
  .option('--verbose', 'Add additional details if something goes wrong', false)
  .showHelpAfterError()
  .version(packageJson.version);
