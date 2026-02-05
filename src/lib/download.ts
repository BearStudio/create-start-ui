import { Future } from '@swan-io/boxed';
import { writeFile } from 'fs-extra';
import ky from 'ky';
import { temporaryFile } from 'tempy';

import { debug } from '@/lib/debug.js';
import { type Target, getRepoUrl } from '@/lib/repos.js';
import { captureException } from '@/lib/sentry.js';
import { spinner } from '@/lib/spinner.js';

/**
 * Download .tar.gz file from specified branch on the github repository
 * @returns .tar.gz file path where it was downloaded
 */
export const downloadAndSaveRepoTarball = async ({ target, branch }: { target: Target; branch: string }) => {
  const tmpFilePath = temporaryFile();
  const repoUrl = getRepoUrl(target, branch);

  const responseResult = await Future.fromPromise(ky(repoUrl, { timeout: 60_000 }).arrayBuffer());
  if (responseResult.isError()) {
    captureException(responseResult.error);
    debug('Cannot download template from repository', responseResult.error);
    spinner.fail(
      `Cannot download template from repository. Make sure that your connection is ok or that the specified branch exists (${repoUrl}).`,
    );
    process.exit(1);
  }

  const saveFileResult = await Future.fromPromise(writeFile(tmpFilePath, new Uint8Array(responseResult.value)));
  if (saveFileResult.isError()) {
    captureException(saveFileResult.error);
    debug('Cannot save downloaded template file', saveFileResult.error);
    spinner.fail('Cannot write template to disk. Check disk space and permissions.');
    process.exit(1);
  }

  return tmpFilePath;
};
