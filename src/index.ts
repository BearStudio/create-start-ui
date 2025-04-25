#!/usr/bin/env node
import '@/lib/sentry.js';

import { Command } from '@commander-js/extra-typings';
import { confirm } from '@inquirer/prompts';
import { Future, Option } from '@swan-io/boxed';
import { $ } from 'execa';

import path from 'node:path';
import { checkEnv, copyFilesToNewProject, downloadAndSaveRepoTarball, extractTemplateFolder } from '@/functions.js';
import { debug } from '@/lib/debug.js';
import { type Target, repos, spinner } from '@/lib/repos.js';
import chalk from 'chalk';
import { copyFile } from 'fs-extra';
import { temporaryDirectoryTask } from 'tempy';

import { cwd } from 'node:process';
import { config } from '@/lib/conf.js';
import packageJson from '../package.json' with { type: 'json' };

const isTarget = (value: string): value is Target => {
  return ['web', 'native'].includes(value);
};

const parseTarget = (value: string) => {
  return isTarget(value) ? value : null;
};

const program = new Command()
  .argument('<appName>', 'Name of the app to create')
  .option('-b, --branch <branch>', 'Specify a branch you want to use to start')
  .option('-t, --type <type>', 'Type of app you want to create', parseTarget)
  .option('--skip-install', 'Skip node modules installation step', false)
  .option('--skip-git-init', 'Skip git init step', false)
  .option('--verbose', 'Add additional details if something goes wrong', false)
  .version(packageJson.version);

const val = program.parse(process.argv);
const outDirPath = Option.fromNullable(val.args[0]);
if (outDirPath.isNone()) {
  // note: there is no way this condition will be true
  // commander will takes care that the path arg will be set

  // not a huge fan of this approach, could be better
  process.exit(6);
}

const options = val.opts();

// We make this option available in the global scope,
// so debug() function can access it without the need to pass it
// as a parameter everytime we want to use it
global.isVerbose = options.verbose;

// If this is the first time launching the cli
// Ask for telemetry usage approval
if (!config.has('allowTelemetry')) {
  console.log(
    'create-start-ui is using telemetry to track bugs.\nCollected data is anonymous and help us to fix issues.',
  );

  const telemetryApproval = await confirm({
    message: 'Do you allow us to use telemetry to track bugs?',
    default: true,
  });

  config.set('allowTelemetry', telemetryApproval);
}

// Check that there is no existing folder with the same name
// as the outDirPath
await checkEnv({ outDirPath: outDirPath.value });

const type = Option.fromNullable(options.type).getOr('web');

// Download template zip file from target repo
spinner.start(`Creating template into ${path.join(cwd(), outDirPath.value)}`);
const tempFilePath = await downloadAndSaveRepoTarball({
  target: type,
  branch: options.branch ?? repos[type].defaultBranch,
});

await temporaryDirectoryTask(async (tmpDir) => {
  const extractedFolderName = await extractTemplateFolder({
    tarballPath: tempFilePath,
    targetFolderPath: tmpDir,
  });

  const tmpTemplateFolder = path.join(tmpDir, extractedFolderName);
  await copyFilesToNewProject({
    fromFolderPath: tmpTemplateFolder,
    toFolderPath: outDirPath.value,
  });
});

spinner.succeed();
process.chdir(outDirPath.value);

// Init git repository and add first commit
if (!options.skipGitInit) {
  spinner.start('Initializing repository...');

  try {
    await $`git init`;
    await $`git add .`;
    await $`git commit -m "${'feat: initial commit'}"`;
    spinner.succeed();
  } catch (error) {
    debug('Failed to initialize git repository', error);
    spinner.fail();
  }
}

// Copy the .env.example to .env
const envExampleFile = path.resolve(cwd(), '.env.example');
debug('Resolved .env.example path', envExampleFile);
const copyTaskResult = await Future.fromPromise(copyFile(envExampleFile, path.relative(outDirPath.value, '.env')));
copyTaskResult.match({
  Ok: () => {
    debug('.env file created from .env.example');
  },
  Error: (error) => {
    debug('Cannot create .env file.', error);
    console.warn(chalk.yellow('Something went wrong while initializing .env file. You have to create it manually.'));
  },
});

if (!options.skipInstall) {
  spinner.start('Installing dependencies with pnpm...');

  // Make sure pnpm is installed before trying anything
  const checkPnpmCliResult = await Future.fromPromise($`pnpm -v`);
  await checkPnpmCliResult.match({
    Ok: async () => {
      const pnpmInstallExecutionResult = await Future.fromPromise($`pnpm install`);
      if (pnpmInstallExecutionResult.isError()) {
        debug('pnpm install failed', pnpmInstallExecutionResult.error);
        spinner.warn('Something went wrong while installing dependencies with pnpm.');
      }
      spinner.succeed('Installing dependencies with pnpm...');
    },
    Error: (error) => {
      debug('pnpm not detected', error);
      spinner.warn(chalk.yellow('Unable to find pnpm. You will need to install dependencies yourself.'));
    },
  });
}

console.log('');
console.log(chalk.green('✅ Project created!'));
console.log(
  `➡️  Run \`${chalk.grey(`cd ${outDirPath.value}`)}\` and follow getting started instructions in the README.md`,
);
if (type === 'web') {
  console.log('ℹ️  Check https://docs.web.start-ui.com/ for additional guides or details about 🚀 Start UI [web]');
}
