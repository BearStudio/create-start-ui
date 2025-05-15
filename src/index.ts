#!/usr/bin/env node

// note: This import needs to stay at the top
// it allows us to catch unhandled error as soon as they appear
import '@/lib/sentry.js';

import path from 'node:path';
import { cwd } from 'node:process';

import { confirm } from '@inquirer/prompts';
import { Future, Option } from '@swan-io/boxed';
import chalk from 'chalk';
import { $ } from 'execa';
import fg from 'fast-glob';
import fse from 'fs-extra';
import { temporaryDirectoryTask } from 'tempy';

import {
  checkEnv,
  copyFilesToNewProject,
  downloadAndSaveRepoTarball,
  ensureExampleFile,
  extractTemplateFolder,
} from '@/functions.js';
import { program } from '@/lib/cli.js';
import { config } from '@/lib/conf.js';
import { debug } from '@/lib/debug.js';
import { type Target, repos } from '@/lib/repos.js';
import { spinner } from '@/lib/spinner.js';

const parsedCliArgs = program.parse(process.argv);
const outDirPath = Option.fromNullable(parsedCliArgs.args[0]);
if (outDirPath.isNone()) {
  program.outputHelp();
  process.exit();
}

const options = parsedCliArgs.opts();
const type = Option.fromNullable(options.type).getOr('web') as Target;

// We make this option available in the global scope,
// so debug() function can access it without the need to pass it
// as a parameter everytime we want to use it
global.isVerbose = options.verbose;

// If this is the first time launching the cli
// Ask for telemetry usage approval
if (!config.has('allowTelemetry')) {
  console.log(
    'create-start-ui is using telemetry to track bugs.\nCollected data is anonymous and helps us to fix issues.',
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

// Initialize local config files
const globResults = fg.globStream('**/*.example*', { dot: true, fs: fse });
for await (const filePath of globResults) {
  spinner.start(`Initializing ${filePath}`);
  const copyResult = await ensureExampleFile(filePath as string);
  if (copyResult.isError()) {
    debug(`Failed to copy ${filePath}`, copyResult.getError());
    spinner.warn(`Failed to initialize ${(filePath as string).replace('.example', '')}`);
  }
  spinner.succeed();
}

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
    spinner.warn('Unable to run git init, skipping');
  }
}

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
