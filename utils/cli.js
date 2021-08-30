const meow = require('meow');
const meowHelp = require('cli-meow-help');

const flags = {
  debug: {
    type: 'boolean',
    default: false,
    alias: 'd',
    desc: 'Print debug info',
  },
  version: {
    type: 'boolean',
    alias: 'v',
    desc: 'Print CLI version',
  },
  target: {
    type: 'string',
    alias: 't',
    desc: 'StartUI target - web (default), native',
    default: 'web',
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
