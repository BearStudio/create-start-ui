const AdmZip = require('adm-zip');
const { default: axios } = require('axios');
const chalk = require('chalk');
const execa = require('execa');
const fs = require('fs-extra');
const ora = require('ora');
const path = require('path');
const tempy = require('tempy');

const { flags } = require('./cli');
const { gitInit } = flags;

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
const generate = async ({ projectName, outDirPath, target }) => {
  const targetInfos = targets[target];
  spinner.start('Downloading template...');

  // Download zip
  let tempFilePath = null;
  try {
    tempFilePath = await downloadFile(targetInfos.url);
  } catch (errorDownloadingTemplate) {
    debug('Cannot download template from repository', errorDownloadingTemplate);
    spinner.fail(
      chalk.red(
        'Cannot download template from repository. Make sure that your connection is ok.'
      )
    );
    process.exit(1);
  }

  spinner.text = `Extracting template into ${outDirPath}`;
  const zip = new AdmZip(tempFilePath);
  const tmpDir = tempy.directory();
  try {
    zip.extractEntryTo(`${targetInfos.rootFolder}/`, tmpDir, true, true);
    await fs.rename(path.join(tmpDir, targetInfos.rootFolder), outDirPath);
  } catch (extractZipError) {
    debug('An error occured while unziping template', extractZipError);
    spinner.fail(chalk.red('An error occured while unziping template.'));
    console.log(
      `Maybe this folder already exists: ${chalk.grey.underline(outDirPath)}`
    );
    console.log('If this is the case, try removing it.');
    process.exit(1);
  }

  process.chdir(outDirPath);

  if (gitInit) {
    spinner.text = 'Initializing empty repository...';
    await execa('git', ['init']);
  }

  spinner.text = 'Installing dependencies...';
  await execa('yarn', ['install']);

  spinner.succeed(
    `${chalk.green(' Project created and dependencies installed! ')}`
  );
  console.log(`Created ${projectName} at ${outDirPath}`);
  console.log('');
  console.log('You can now run these commands to start using it:');
  console.log('');
  console.log(`  ${chalk.cyan(`cd ${chalk.white(projectName)}`)}`);
  console.log(`  ${chalk.cyan('yarn dev')}`);
  console.log('');
};

module.exports = {
  targets,
  generate,
};
