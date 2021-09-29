const unhandled = require('cli-handle-unhandled');
const { logo, title } = require('./title');

module.exports = () => {
  unhandled();
  console.clear();
  console.log(`${logo}${title}`);
};
