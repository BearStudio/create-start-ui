import type { Target } from '@/lib/repos.js';
import { Command } from 'commander';

import packageJson from '../../package.json' with { type: 'json' };

const isTarget = (value: string): value is Target => {
  return ['web', 'native'].includes(value);
};

const parseTarget = (value: string) => {
  return isTarget(value) ? value : null;
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
