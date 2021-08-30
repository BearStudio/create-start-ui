const welcome = require('cli-welcome');
const pkg = require('./../package.json');
const unhandled = require('cli-handle-unhandled');

module.exports = () => {
  unhandled();
  welcome({
    title: `create-start-ui`,
    tagLine: `by Renan Decamps`,
    description: pkg.description,
    version: pkg.version,
    bgColor: '#36BB09',
    color: '#000000',
    bold: true,
    clear: false,
  });
};
