import path from 'node:path';
import { cwd } from 'node:process';
import { debug } from '@/lib/debug.js';
import { type Target, replacableIndicator, repos } from '@/lib/repos.js';
import { spinner } from '@/lib/spinner.js';
import { Future } from '@swan-io/boxed';
import chalk from 'chalk';
import { exists, readdir, writeFile } from 'fs-extra';
import ky from 'ky';
import { moveFile } from 'move-file';
import { extract } from 'tar';
import { temporaryFile } from 'tempy';

/**
 * Make sure you can create a start-ui project with the specified cli arguments
 * Exit the program if requirements are not met
 */
export const checkEnv = async ({ outDirPath }: { outDirPath: string }) => {
  const checkDirExistResult = await Future.fromPromise(exists(outDirPath));
  if (checkDirExistResult.isError()) {
    spinner.fail('Cannot check if the folder exists. Make sure you have sufficient rights on your system.');
    process.exit(7);
  }

  // First, check if the destination folder already exists
  if (!checkDirExistResult.value) {
    // If the folder do not already exists, continue the script
    return;
  }

  console.log();
  console.log(`This folder may already exists: ${chalk.yellow.underline(path.join(cwd(), outDirPath))}`);
  console.log('If this is the case, try removing it first.');
  console.log();
  process.exit(2);
};

/**
 * Download .tar.gz file from specified branch on the github repository
 * @returns .tar.gz file path where it was downloaded
 */
export const downloadAndSaveRepoTarball = async ({
  target,
  branch,
}: {
  target: Target;
  branch: string;
}) => {
  const tmpFilePath = temporaryFile();
  const targetInfos = repos[target];
  const repoUrl = targetInfos.url.replace(replacableIndicator, branch);

  const responseResult = await Future.fromPromise(
    ky(repoUrl, {
      responseType: 'stream',
    }).arrayBuffer(),
  );
  if (responseResult.isError()) {
    debug('Cannot download template from repository', responseResult.error);
    spinner.fail(
      `Cannot download template from repository. Make sure that your connection is ok or that the specified branch exists (${repoUrl}).`,
    );
    console.log('');
    process.exit(1);
  }

  const saveFileResult = await Future.fromPromise(writeFile(tmpFilePath, Buffer.from(responseResult.value)));
  if (saveFileResult.isError()) {
    debug('Cannot saved downloaded template file', saveFileResult.error);
    spinner.fail('');
    console.log(
      `Cannot download template from repository. Make sure that your connection is ok or that the specified branch exists (${repoUrl}).`,
    );
    process.exit(1);
  }

  return tmpFilePath;
};

/**
 * Extract tar file into provided folder
 * @returns extracted folder path
 */
export const extractTemplateFolder = async ({
  tarballPath,
  targetFolderPath,
}: {
  tarballPath: string;
  targetFolderPath: string;
}) => {
  let extractedFolderName = '';

  const extractResult = await Future.fromPromise(extract({ file: tarballPath, cwd: targetFolderPath }));
  if (extractResult.isError()) {
    debug('an error occurred while extracting the template archive.', extractResult.error);
    spinner.fail(chalk.red('An error occurred while extracting the template archive'));
    process.exit(2);
  }

  const filesResult = await Future.fromPromise(readdir(targetFolderPath));
  if (filesResult.isError()) {
    debug('An error occurred while reading the extracting files', filesResult.error);
    spinner.fail('An error occurred while extracting the template archive');
    process.exit(3);
  }

  if (!filesResult.value[0]) {
    debug('An error occurred while reading folder name', filesResult.value.length);
    spinner.fail('An error occurred while extracting the template archive');
    process.exit(6);
  }
  extractedFolderName = filesResult.value[0];
  debug('Template extracted');

  return extractedFolderName;
};

/**
 * Copy files from extracted folder into correct new project folder
 */
export const copyFilesToNewProject = async ({
  fromFolderPath,
  toFolderPath,
}: {
  fromFolderPath: string;
  toFolderPath: string;
}) => {
  const moveResult = await Future.fromPromise(moveFile(fromFolderPath, toFolderPath));

  if (moveResult.isOk()) {
    return;
  }

  if (moveResult.isError()) {
    debug('An error occurred while moving files.', moveResult.error);
    spinner.fail(chalk.red('An error occurred while moving files.'));
    process.exit(5);
  }

  debug('Moved files from', fromFolderPath, 'to', toFolderPath);
};
