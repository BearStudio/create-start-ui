export type Repo = {
  url: string;
  defaultBranch: string;
};

export const replacableIndicator = '<branch>';

export const repos: Record<Target, Repo> = {
  web: {
    url: `https://github.com/BearStudio/start-ui-web/archive/refs/heads/${replacableIndicator}.tar.gz`,
    defaultBranch: 'master',
  },
  native: {
    url: `https://github.com/BearStudio/start-ui-native/archive/refs/heads/${replacableIndicator}.tar.gz`,
    defaultBranch: 'main',
  },
} as const;
export type Target = 'web' | 'native';
