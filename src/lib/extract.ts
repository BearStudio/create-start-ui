import { Future } from '@swan-io/boxed';
import chalk from 'chalk';
import { move, readdir } from 'fs-extra';
import { extract } from 'tar';

import { debug } from '@/lib/debug.js';
import { captureException } from '@/lib/sentry.js';
import { spinner } from '@/lib/spinner.js';

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
  const extractResult = await Future.fromPromise(extract({ file: tarballPath, cwd: targetFolderPath }));
  if (extractResult.isError()) {
    captureException(extractResult.error);
    debug('an error occurred while extracting the template archive.', extractResult.error);
    spinner.fail(chalk.red('An error occurred while extracting the template archive'));
    process.exit(2);
  }

  const filesResult = await Future.fromPromise(readdir(targetFolderPath));
  if (filesResult.isError()) {
    captureException(filesResult.error);
    debug('An error occurred while reading the extracting files', filesResult.error);
    spinner.fail('An error occurred while extracting the template archive');
    process.exit(3);
  }

  if (!filesResult.value[0]) {
    captureException(new Error('An error occurred while reading folder name', { cause: filesResult.value }));
    debug('An error occurred while reading folder name', filesResult.value.length);
    spinner.fail('An error occurred while extracting the template archive');
    process.exit(6);
  }
  return filesResult.value[0];
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
  const moveResult = await Future.fromPromise(move(fromFolderPath, toFolderPath));

  moveResult.match({
    Ok: () => {
      debug('Moved files from', fromFolderPath, 'to', toFolderPath);
    },
    Error: (moveResultError) => {
      captureException(moveResultError);
      debug('An error occurred while moving files.', moveResultError);
      spinner.fail(chalk.red('An error occurred while moving files.'));
      process.exit(5);
    },
  });
};
