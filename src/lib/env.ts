import path from 'node:path';
import { cwd } from 'node:process';

import { Future } from '@swan-io/boxed';
import chalk from 'chalk';
import { exists } from 'fs-extra';

import { captureException } from '@/lib/sentry.js';
import { spinner } from '@/lib/spinner.js';

/**
 * Make sure you can create a start-ui project with the specified cli arguments
 * Exit the program if requirements are not met
 */
export const checkEnv = async ({ outDirPath }: { outDirPath: string }) => {
  const checkDirExistResult = await Future.fromPromise(exists(outDirPath));
  if (checkDirExistResult.isError()) {
    captureException(checkDirExistResult.error);
    spinner.fail('Cannot check if the folder exists. Make sure you have sufficient rights on your system.');
    process.exit(7);
  }

  // First, check if the destination folder already exists
  if (!checkDirExistResult.value) {
    // If the folder does not already exist, continue the script
    return;
  }

  console.log();
  console.log(`This folder already exists: ${chalk.yellow.underline(path.join(cwd(), outDirPath))}`);
  console.log('Try removing or renaming it first.');
  console.log();
  process.exit(2);
};
