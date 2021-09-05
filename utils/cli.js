const meow = require('meow');
const meowHelp = require('cli-meow-help');

const flags = {
  version: {
    type: 'boolean',
    alias: 'v',
    desc: 'Print CLI version',
  },
  web: {
    type: 'boolean',
    desc: 'Create a new start-ui-web project',
    default: false,
  },
  native: {
    type: 'boolean',
    desc: 'Create a new start-ui-native project',
    default: false,
  },
};

const commands = {
  help: { desc: `Print help info` },
};

const helpText = meowHelp({
  name: `create-start-ui`,
  flags,
  commands,
});

const options = {
  inferType: true,
  description: false,
  hardRejection: false,
  flags,
};

module.exports = meow(helpText, options);
