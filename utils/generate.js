const AdmZip = require('adm-zip');
const { default: axios } = require('axios');
const chalk = require('chalk');
const execa = require('execa');
const fs = require('fs-extra');
const ora = require('ora');
const path = require('path');
const tempy = require('tempy');

const { debug } = require('./debug');

const targets = {
  web: {
    url: 'https://github.com/BearStudio/start-ui-web/archive/refs/heads/master.zip',
    rootFolder: 'start-ui-web-master',
  },
  native: {
    url: 'https://github.com/BearStudio/start-ui-native/archive/refs/heads/main.zip',
    rootFolder: 'start-ui-native-main',
  },
};

const downloadFile = async (url) => {
  const tmpFilePath = tempy.file();
  const file = fs.createWriteStream(tmpFilePath);
  const response = await axios.get(url, { responseType: 'stream' });
  response.data.pipe(file);

  return new Promise((resolve, reject) => {
    file.on('finish', () => resolve(tmpFilePath));
    file.on('error', reject);
  });
};

const spinner = ora({ text: '' });
const generate = async ({ outDirPath, target }) => {
  const targetInfos = targets[target];
  spinner.start(
    `${chalk.green('DEPENDENCIES')} installing…\n\n${chalk.dim(
      'It may take moment…',
    )}`,
  );

  // Download zip
  let tempFilePath = null;
  try {
    tempFilePath = await downloadFile(targetInfos.url);
  } catch (errorDownloadingTemplate) {
    debug('Cannot download template from repository', errorDownloadingTemplate);
    spinner.fail(
      chalk.red(
        'Cannot download template from repository. Make sure that your connection is ok.',
      ),
    );
    process.exit(1);
  }

  const zip = new AdmZip(tempFilePath);
  const tmpDir = tempy.directory();
  try {
    zip.extractEntryTo(`${targetInfos.rootFolder}/`, tmpDir, true, true);
    await fs.rename(path.join(tmpDir, targetInfos.rootFolder), outDirPath);
  } catch (extractZipError) {
    debug('An error occured while unziping template', extractZipError);
    spinner.fail(chalk.red('An error occured while unziping template.'));
    process.exit(1);
  }

  process.chdir(outDirPath);
  await execa.sync('yarn', ['install']);

  spinner.succeed(`${chalk.green('DEPENDENCIES')} installed!`);
};

module.exports = {
  targets,
  generate,
};
