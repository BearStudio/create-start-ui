import ora from 'ora';

export const replacableIndicator = '<branch>';

export const targets = {
  web: {
    url: `https://github.com/BearStudio/start-ui-web/archive/refs/heads/${replacableIndicator}.tar.gz`,
    rootFolder: `start-ui-web-${replacableIndicator}`,
  },
  native: {
    url: `https://github.com/BearStudio/start-ui-native/archive/refs/heads/${replacableIndicator}.tar.gz`,
    rootFolder: `start-ui-native-${replacableIndicator}`,
  },
};

export const spinner = ora({ text: '' });
