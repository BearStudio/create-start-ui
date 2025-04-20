import { copy, exists } from "fs-extra";
import fs from "node:fs/promises";
import chalk from "chalk";
import {
  replacableIndicator,
  repos,
  spinner,
  type Target,
} from "@/config/repos.js";
import { temporaryFile } from "tempy";
import ky from "ky";
import { extract } from "tar";
import { Future } from "@swan-io/boxed";
import { debug } from "./config/debug.js";
import { moveFile } from "move-file";

/**
 * Make sure you can create a start-ui project with the specified cli arguments
 * Exit the program if requirements are not met
 */
export const checkEnv = async ({ outDirPath }: { outDirPath: string }) => {
  const checkDirExistResult = await Future.fromPromise(exists(outDirPath));
  if (checkDirExistResult.isError()) {
    // First, check if the destination folder already exists
    console.log(
      `This folder may already exists: ${chalk.yellow.underline(outDirPath)}`,
    );
    console.log("If this is the case, try removing it first.");
    console.log();
    process.exit(2);
  }
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
  spinner.start("Downloading template...");
  const tmpFilePath = temporaryFile();
  const targetInfos = repos[target];
  const repoUrl = targetInfos.url.replace(replacableIndicator, branch);

  try {
    debug("downloading repo tar.gz: ", repoUrl);
    const response = await ky(repoUrl, {
      responseType: "stream",
    }).arrayBuffer();
    await fs.writeFile(tmpFilePath, Buffer.from(response));
  } catch (errorDownloadingTemplate) {
    debug("Cannot download template from repository", errorDownloadingTemplate);
    spinner.fail(
      chalk.red(
        `Cannot download template from repository. Make sure that your connection is ok or that the specified branch exists (${repoUrl}).`,
      ),
    );
    console.log("");
    process.exit(1);
  }
  spinner.succeed();
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
  let extractedFolderName = "";

  const extractResult = await Future.fromPromise(
    extract({ file: tarballPath, cwd: targetFolderPath }),
  );
  if (extractResult.isError()) {
    debug(
      "an error occured while extracting the template archive.",
      extractResult.error,
    );
    spinner.fail(
      chalk.red("An error occured while extracting the template archive"),
    );
    process.exit(2);
  }

  const filesResult = await Future.fromPromise(fs.readdir(targetFolderPath));
  if (filesResult.isError()) {
    debug(
      "An error occured while reading the extracting files",
      filesResult.error,
    );
    spinner.fail("An error occured while extracting the template archive");
    process.exit(3);
  }

  if (!filesResult.value[0]) {
    debug(
      "An error occured while reading folder name",
      filesResult.value.length,
    );
    spinner.fail("An error occured while extracting the template archive");
    process.exit(6);
  }
  extractedFolderName = filesResult.value[0];
  debug("Template extracted");

  return extractedFolderName;
};

/**
 * Copy files from extracted folder into correct new project fodler
 */
export const copyFilesToNewProject = async ({
  fromFolderPath,
  toFolderPath,
}: {
  fromFolderPath: string;
  toFolderPath: string;
}) => {
  const moveResult = await Future.fromPromise(
    moveFile(fromFolderPath, toFolderPath),
  );

  if (moveResult.isOk()) {
    return;
  }

  if (moveResult.isError()) {
    debug("An error occured while moving files.", moveResult.error);
    spinner.fail(chalk.red("An error occured while moving files."));
    process.exit(5);
  }

  debug("Moved files from", fromFolderPath, "to", toFolderPath);
};
