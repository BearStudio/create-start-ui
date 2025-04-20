#!/usr/bin/env node
import { Command } from "@commander-js/extra-typings";
import { Option } from "@swan-io/boxed";
import ora from "ora";

import packageJson from "../package.json" with { type: "json" };
import { type Target, repos } from "./config/repos.js";
import { checkEnv, downloadAndSaveRepoTarball } from "./functions.js";

const isTarget = (value: string): value is Target => {
  return ["web", "native"].includes(value);
};

const parseTarget = (value: string) => {
  return isTarget(value) ? value : null;
};

const program = new Command()
  .argument("<appName>", "Name of the app to create")
  .option("-b, --branch <branch>", "Specify a branch you want to use to start")
  .option("-t, --type <type>", "Type of app you want to create", parseTarget)
  .option("--skip-install", "Skip node modules installation step", false)
  .option("--skip-git-init", "Skip git init step", false)
  .version(packageJson.version);

const val = program.parse(process.argv);
const outDirPath = Option.fromNullable(val.args[0]);
if (outDirPath.isNone()) {
  // NOTE: there is no way this condition will be true
  // commander will takes care that the path arg will be set
  process.exit(6);
}

const options = val.opts();
const spinner = ora({ text: "Downloading template..." });
spinner.start();

// Check that there is no existing folder with the same name
// as the outDirPath
await checkEnv({ outDirPath: outDirPath.value });

const type = Option.fromNullable(options.type).getOr("web");

// Download template zip file from target repo
const tempFilePath = await downloadAndSaveRepoTarball({
  target: type,
  branch: options.branch ?? repos[type].defaultBranch,
});
