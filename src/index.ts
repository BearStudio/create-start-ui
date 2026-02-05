#!/usr/bin/env node

// note: This import needs to stay at the top
// it allows us to catch unhandled error as soon as they appear
import '@/lib/sentry.js';

import path from 'node:path';
import { cwd } from 'node:process';

import { confirm, select } from '@inquirer/prompts';
import { Future, Option } from '@swan-io/boxed';
import chalk from 'chalk';
import { $ } from 'execa';
import { temporaryDirectoryTask } from 'tempy';
import { match } from 'ts-pattern';

import { program } from '@/lib/cli.js';
import { config } from '@/lib/conf.js';
import { debug, setVerbose } from '@/lib/debug.js';
import { downloadAndSaveRepoTarball } from '@/lib/download.js';
import { checkEnv } from '@/lib/env.js';
import { copyFilesToNewProject, extractTemplateFolder } from '@/lib/extract.js';
import { type Target, getDefaultBranch } from '@/lib/repos.js';
import { captureException } from '@/lib/sentry.js';
import { spinner } from '@/lib/spinner.js';
import { runNativePostSetup } from '@/target/native/index.js';
import { runWebPostSetup } from '@/target/web/index.js';

const parsedCliArgs = program.parse(process.argv);
const outDirPath = Option.fromNullable(parsedCliArgs.args[0]);
if (outDirPath.isNone()) {
  program.outputHelp();
  process.exit(1);
}

const projectName = outDirPath.value;
// Project name is used as a folder name, so we reject characters like /
const validNamePattern = /^[a-zA-Z0-9_@][a-zA-Z0-9._-]*$/;
if (!validNamePattern.test(projectName)) {
  console.log();
  console.log(chalk.red(`Invalid project name: ${chalk.bold(projectName)}`));
  console.log('Project name must start with a letter, digit, _ or @, and contain only letters, digits, ., _ or -.');
  console.log();
  process.exit(1);
}

const options = parsedCliArgs.opts();
const type: Target = await Option.fromNullable(options.type).match({
  Some: (value) => value,
  None: () =>
    select<Target>({
      message: 'What type of project do you want to create?',
      choices: [
        { name: 'Web', value: 'web' },
        { name: 'Native', value: 'native' },
      ],
    }),
});

setVerbose(options.verbose);

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

// Download template tarball from target repo
spinner.start('Downloading template...');
const tempFilePath = await downloadAndSaveRepoTarball({
  target: type,
  branch: options.branch ?? getDefaultBranch(type),
});
spinner.succeed('Template downloaded');

// Extract and copy files to project folder
spinner.start(`Creating project in ${path.join(cwd(), outDirPath.value)}`);
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
spinner.succeed('Project created');
process.chdir(outDirPath.value);

// Init git repository and add first commit
if (!options.skipGitInit) {
  spinner.start('Initializing repository...');

  try {
    await $`git init`;
    await $`git add .`;
    await $`git commit -m ${'feat: initial commit'}`;
    spinner.succeed('Repository initialized');
  } catch (error) {
    captureException(error);
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
        captureException(pnpmInstallExecutionResult.error);
        debug('pnpm install failed', pnpmInstallExecutionResult.error);
        spinner.warn('Something went wrong while installing dependencies with pnpm.');
      } else {
        spinner.succeed('Dependencies installed');
      }
    },
    Error: (error) => {
      debug('pnpm not detected', error);
      spinner.warn(chalk.yellow('Unable to find pnpm. You will need to install dependencies yourself.'));
    },
  });
}

console.log('');
console.log(chalk.green('Project created successfully!'));
console.log(`Run ${chalk.cyan(`cd ${outDirPath.value}`)} and follow getting started instructions in the README.md`);

// Once the repo template has been copied into
// the desired folder, run target specific scripts
match(type).with('web', runWebPostSetup).with('native', runNativePostSetup).exhaustive();
