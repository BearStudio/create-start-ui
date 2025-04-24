#!/usr/bin/env node
import { Command } from '@commander-js/extra-typings';
import { Future, Option } from '@swan-io/boxed';
import { $ } from 'execa';
import ora from 'ora';

import path from 'node:path';
import { debug } from '@/config/debug.js';
import { type Target, repos } from '@/config/repos.js';
import {
  checkEnv,
  copyFilesToNewProject,
  downloadAndSaveRepoTarball,
  extractTemplateFolder,
} from '@/functions.js';
import chalk from 'chalk';
import { copyFile, ensureFile } from 'fs-extra';
import { temporaryDirectoryTask } from 'tempy';

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
  // NOTE: there is no way this condition will be true
  // commander will takes care that the path arg will be set
  process.exit(6);
}

const options = val.opts();
global.isVerbose = options.verbose;
const spinner = ora({ text: 'Downloading template...' });

// Check that there is no existing folder with the same name
// as the outDirPath
await checkEnv({ outDirPath: outDirPath.value });

const type = Option.fromNullable(options.type).getOr('web');

// Download template zip file from target repo
const tempFilePath = await downloadAndSaveRepoTarball({
  target: type,
  branch: options.branch ?? repos[type].defaultBranch,
});

spinner.start(`Extracting template into ${outDirPath.value}`);

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

process.chdir(outDirPath.value);

spinner.succeed();

if (!options.skipGitInit) {
  spinner.start('Initializing repository...');

  try {
    await $`git init`;
    await $`git add .`;
    await $`git commit -m "feat: initial commit"`;
  } catch {
    // TODO: make sure to remove .git folder if initialisation fail
    spinner.fail();
  }

  spinner.succeed();
}

// Block to copy the .env.example to .env
const envExampleFile = path.resolve(outDirPath.value, '.env.example');
await Future.fromPromise(ensureFile(envExampleFile))
  .mapOk(() => {
    copyFile(envExampleFile, path.relative(outDirPath.value, '.env'));
  })
  .tapError(() =>
    console.log(
      chalk.yellow(
        'Something went wrong while initializing .env file. You have to create it manually.',
      ),
    ),
  );

if (!options.skipInstall) {
  spinner.start('Installing dependencies with pnpm...');

  // Make sure pnpm is installed before trying anything
  const checkPnpmCliResult = await Future.fromPromise($`pnpm -v`);
  if (checkPnpmCliResult.isError()) {
    debug('pnpm not detected', checkPnpmCliResult.error);
    spinner.warn(
      chalk.yellow(
        'Unable to find pnpm. You will need to install dependencies yourself.',
      ),
    );
  } else {
    const pnpmInstallExecutionResult =
      await Future.fromPromise($`pnpm installdhudiz`);
    if (pnpmInstallExecutionResult.isError()) {
      debug('pnpm install failed', pnpmInstallExecutionResult.error);
      spinner.warn(
        'Something went wrong while installing dependencies with pnpm.',
      );
      console.log(chalk.green('Project created!'));
    } else {
      spinner.succeed(
        `${chalk.green('Project created and dependencies installed! ')}`,
      );
    }
  }
}

console.log(
  'Go into the created folder and follow getting started instruction in the README.md',
);
console.log('');
if (type === 'web') {
  console.log(
    'Check https://docs.web.start-ui.com/ for informations, or the documentations of the various technologies 🚀 Start UI [web] uses',
  );
}
