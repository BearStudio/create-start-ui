export type Target = 'web' | 'native';

type Repo = {
  baseUrl: string;
  defaultBranch: string;
};

const repos: Record<Target, Repo> = {
  web: {
    baseUrl: 'https://github.com/BearStudio/start-ui-web/archive/refs/heads',
    defaultBranch: 'main',
  },
  native: {
    baseUrl: 'https://github.com/BearStudio/start-ui-native/archive/refs/heads',
    defaultBranch: 'main',
  },
};

export const getDefaultBranch = (target: Target): string => repos[target].defaultBranch;

export const getRepoUrl = (target: Target, branch: string): string =>
  `${repos[target].baseUrl}/${encodeURIComponent(branch)}.tar.gz`;
