#!/usr/bin/env node
import { Command } from '@commander-js/extra-typings';
import { Future, Option } from '@swan-io/boxed';
import { execa } from 'execa';
import ora from 'ora';

import path from 'node:path';
import chalk from 'chalk';
import { copyFile, ensureFile } from 'fs-extra';
import { temporaryDirectoryTask } from 'tempy';
import packageJson from '../package.json' with { type: 'json' };
import { type Target, repos } from './config/repos.js';
import {
  checkEnv,
  copyFilesToNewProject,
  downloadAndSaveRepoTarball,
  extractTemplateFolder,
} from './functions.js';

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
  .version(packageJson.version);

const val = program.parse(process.argv);
const outDirPath = Option.fromNullable(val.args[0]);
if (outDirPath.isNone()) {
  // NOTE: there is no way this condition will be true
  // commander will takes care that the path arg will be set
  process.exit(6);
}

const options = val.opts();
const spinner = ora({ text: 'Downloading template...' });
spinner.start();

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
    await execa`git init`;
    await execa`git add .`;
    await execa`git commit -m "feat: initial commit"`;
  } catch {
    // TODO: make sure to remore .git folder if initialisation fail
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
    // TODO: use warning colors here
    console.log(
      'Something went wrong while initializing .env file. You have to create it manually.',
    ),
  );

if (!options.skipInstall) {
  // TODO: checks for pnpm installation, fail if not system wide available
  spinner.start('Installing dependencies with pnpm...');
  await execa`pnpm install`;
  spinner.succeed();

  spinner.succeed(
    `${chalk.green('Project created and dependencies installed! ')}`,
  );
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
