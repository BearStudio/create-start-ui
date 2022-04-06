const tar = require('tar');
const { default: axios } = require('axios');
const chalk = require('chalk');
const execa = require('execa');
const fs = require('fs-extra');
const ora = require('ora');
const path = require('node:path');
const tempy = require('tempy');

const { flags } = require('./cli');
const { gitInit } = flags;

const { debug } = require('./debug');

const targets = {
  web: {
    url: 'https://github.com/BearStudio/start-ui-web/archive/refs/heads/master.tar.gz',
    rootFolder: 'start-ui-web-master',
  },
  native: {
    url: 'https://github.com/BearStudio/start-ui-native/archive/refs/heads/main.tar.gz',
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

  const tmpDir = tempy.directory();

  try {
    await tar.extract({ file: tempFilePath, cwd: tmpDir });
    debug('Template extracted');
  } catch (extractArchiveError) {
    debug(
      'An error occured while extracting the template archive.',
      extractArchiveError
    );
    spinner.fail(
      chalk.red('An error occured while cting the template archive.')
    );
    console.log(
      `This folder may already exists: ${chalk.grey.underline(outDirPath)}`
    );
    console.log('If this is the case, try removing it.');
    process.exit(2);
  }

  const tmpTemplateFolder = path.join(tmpDir, targetInfos.rootFolder);
  try {
    try {
      await fs.rename(tmpTemplateFolder, outDirPath);
    } catch (renameFilesError) {
      debug('Unable to use rename(), trying alternative', renameFilesError);
      // Alternative for Microsoft partitions (copying from C: to D:)
      if (renameFilesError.code === 'EXDEV') {
        await fs.copy(tmpTemplateFolder, outDirPath);
        debug('Copied files from', tmpTemplateFolder, 'to', outDirPath);
      }
    }
  } catch (error) {
    debug('An error occured while moving files.', error);
    spinner.fail(chalk.red('An error occured while moving files.'));
    process.exit(3);
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
