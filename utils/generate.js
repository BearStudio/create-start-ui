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

  spinner.succeed();

  spinner.start(`Extracting template into ${outDirPath}`);

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
      chalk.red('An error occured while extracting the template archive.')
    );
    console.log(
      `This folder may already exists: ${chalk.grey.underline(outDirPath)}`
    );
    console.log('If this is the case, try removing it.');
    process.exit(2);
  }

  spinner.succeed();
  spinner.start(`Copying files to ${targetInfos.rootFolder}`);

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

  spinner.succeed();
  if (gitInit) {
    spinner.start('Initializing repository...');

    try {
      await execa('git', ['init']);
      await execa('git', ['add', '.']);
      await execa('git', [
        'commit',
        '-m',
        'feat: init repository from create-start-ui',
      ]);
    } catch {
      spinner.fail();
    }

    spinner.succeed();
  }

  // Block to copy the .env.example to .env
  try {
    // throw an exception if the file does not exist
    const envExampleFile = path.resolve(outDirPath, '.env.example');
    await fs.ensureFile(envExampleFile);
    await fs.copyFile(envExampleFile, path.relative(outDirPath, '.env'));
  } catch {
    // No catch, we just want to make sure the file exist.
  }

  spinner.start('Installing dependencies...');
  await execa('yarn', ['install']);
  spinner.succeed();

  // Block for web target, to seed db
  if (target === 'web') {
    spinner.start('Creating database...');
    await execa('yarn', ['db:push']);
    spinner.succeed();
    spinner.start('Seeding database...');
    await execa('yarn', ['db:seed']);
    spinner.succeed();
  }

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
  console.log(
    'Check https://docs.web.start-ui.com/ for informations, or the documentations of the various technologies 🚀 Start UI [web] uses'
  );
};

module.exports = {
  targets,
  generate,
};
