import chalk from 'chalk';
import fs from 'fs-extra';
import ky from 'ky';
import tar from 'tar';
import { temporaryFile } from 'tempy';

import cli from './config/cli.js';
import { replacableIndicator, spinner, targets } from './config/constants.js';
import { debug } from './debug.js';

const { branch } = cli.flags;

/**
 * Make sure you can create a start-ui project with the specified cli arguments
 * Exit the program if requirements are not met
 */
export const checkEnv = async ({ outDirPath }) => {
  if (await fs.exists(outDirPath)) {
    // First, check if the destination folder already exists
    console.log(
      `This folder may already exists: ${chalk.yellow.underline(outDirPath)}`
    );
    console.log('If this is the case, try removing it first.');
    console.log();
    process.exit(2);
  }
};

/**
 * Download .tar.gz file from specified branch on the github repository
 * @returns .tar.gz file path where it was downloaded
 */
export const downloadAndSaveRepoTarball = async ({ target }) => {
  spinner.start('Downloading template...');
  const tmpFilePath = temporaryFile();
  const targetInfos = targets[target];
  const repoUrl = targetInfos.url.replace(replacableIndicator, branch);

  try {
    debug('downloading repo tar.gz: ', repoUrl);
    const response = await ky(repoUrl, {
      responseType: 'stream',
    }).arrayBuffer();
    await fs.writeFile(tmpFilePath, Buffer.from(response));
  } catch (errorDownloadingTemplate) {
    debug('Cannot download template from repository', errorDownloadingTemplate);
    spinner.fail(
      chalk.red(
        `Cannot download template from repository. Make sure that your connection is ok or that the specified branch exists (${repoUrl}).`
      )
    );
    console.log('');
    process.exit(1);
  }
  spinner.succeed();
  return tmpFilePath;
};

/**
 * Extract tar file into provided folder
 */
export const extractTemplateFolder = async ({
  tarballPath,
  targetFolderPath,
}) => {
  let extractedFolderName = '';
  try {
    await tar.extract({ file: tarballPath, cwd: targetFolderPath });
    const files = await fs.readdir(targetFolderPath);
    extractedFolderName = files[0];
    debug('Template extracted');
  } catch (extractArchiveError) {
    debug(
      'An error occurred while extracting the template archive.',
      extractArchiveError
    );
    spinner.fail(
      chalk.red('An error occurred while extracting the template archive.')
    );
    process.exit(2);
  }

  return extractedFolderName;
};

export const copyFilesToNewProject = async ({
  fromFolderPath,
  toFolderPath,
}) => {
  try {
    try {
      await fs.rename(fromFolderPath, toFolderPath);
    } catch (renameFilesError) {
      debug('Unable to use rename(), trying alternative', renameFilesError);
      // Alternative for Microsoft partitions (copying from C: to D:)
      if (renameFilesError.code === 'EXDEV') {
        await fs.copy(fromFolderPath, toFolderPath);
        debug('Copied files from', fromFolderPath, 'to', toFolderPath);
      }
    }
  } catch (error) {
    debug('An error occurred while moving files.', error);
    spinner.fail(chalk.red('An error occurred while moving files.'));
    process.exit(3);
  }
};
