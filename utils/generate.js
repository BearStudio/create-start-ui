const ora = require('ora');
const fs = require('fs-extra');
const chalk = require('chalk');

const spinner = ora({ text: '' });
module.exports = async ({ outDirPath }) => {
  spinner.start(
    `${chalk.green('DEPENDENCIES')} installing…\n\n${chalk.dim(
      'It may take moment…',
    )}`,
  );

  // create folder
  try {
    await fs.mkdir(outDirPath);
  } catch (errorCreatingProjectDir) {
    ora.fail(
      chalk.red(`Unable to create the folder under ${chalk.dim(outDirPath)}.`),
    );
    process.exit(1);
  }

  fs.process.chdir(outDirPath);
  // await execa('npm', ['install']);
  spinner.succeed(`${chalk.green('DEPENDENCIES')} installed!`);
};
