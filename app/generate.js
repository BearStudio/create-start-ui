import chalk from 'chalk';
import { execa } from 'execa';
import fs from 'fs-extra';
import { temporaryDirectoryTask } from 'tempy';

import path from 'node:path';

import cli from './config/cli.js';
import { spinner } from './config/constants.js';
import {
  checkEnv,
  copyFilesToNewProject,
  downloadAndSaveRepoTarball,
  extractTemplateFolder,
} from './functions.js';

const { gitInit, packageInstall } = cli.flags;

export const generate = async ({ projectName, outDirPath, target }) => {
  await checkEnv({ outDirPath });

  // Download zip
  let tempFilePath = await downloadAndSaveRepoTarball({ target });

  spinner.start(`Extracting template into ${outDirPath}`);

  // We use this method so the temporary diretory will be deleted after
  // the task completion
  await temporaryDirectoryTask(async (tmpDir) => {
    const extractedFolderName = await extractTemplateFolder({
      tarballPath: tempFilePath,
      targetFolderPath: tmpDir,
    });

    const tmpTemplateFolder = path.join(tmpDir, extractedFolderName);
    await copyFilesToNewProject({
      fromFolderPath: tmpTemplateFolder,
      toFolderPath: outDirPath,
    });
  });

  process.chdir(outDirPath);

  spinner.succeed();
  if (gitInit) {
    spinner.start('Initializing repository...');

    try {
      await execa('git', ['init']);
      await execa('git', ['add', '.']);
      await execa('git', [
        'commit',
        '-m',
        'feat: init repository from create-start-ui',
      ]);
    } catch {
      spinner.fail();
    }

    spinner.succeed();
  }

  // Block to copy the .env.example to .env
  try {
    // throw an exception if the file does not exist
    const envExampleFile = path.resolve(outDirPath, '.env.example');
    await fs.ensureFile(envExampleFile);
    await fs.copyFile(envExampleFile, path.relative(outDirPath, '.env'));
  } catch {
    // No catch, we just want to make sure the file exist.
  }

  if (packageInstall) {
    let packageManager = 'yarn';
    const pnpmLockFile = path.resolve(outDirPath, 'pnpm-lock.yaml');
    if (await fs.exists(pnpmLockFile)) {
      packageManager = 'pnpm';
    }

    spinner.start(`Installing dependencies using ${packageManager}...`);
    await execa(packageManager, ['install']);
    spinner.succeed();

    spinner.succeed(
      `${chalk.green('Project created and dependencies installed! ')}`
    );
  }

  console.log(`Created ${projectName} at ${outDirPath}`);
  console.log('');
  console.log(
    'Go into the created folder and follow getting started instruction in the README.md'
  );
  console.log('');
  if (target === 'web') {
    console.log(
      'Check https://docs.web.start-ui.com/ for informations, or the documentations of the various technologies 🚀 Start UI [web] uses'
    );
  }
};
