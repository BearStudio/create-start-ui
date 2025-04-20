import ora from "ora";

export type Repo = {
  url: string;
  defaultBranch: string;
  rootFolder: string;
};

export const replacableIndicator = "<branch>";

export const repos: Record<Target, Repo> = {
  web: {
    url: `https://github.com/BearStudio/start-ui-web/archive/refs/heads/${replacableIndicator}.tar.gz`,
    rootFolder: `start-ui-web-${replacableIndicator}`,
    defaultBranch: "master",
  },
  native: {
    url: `https://github.com/BearStudio/start-ui-native/archive/refs/heads/${replacableIndicator}.tar.gz`,
    rootFolder: `start-ui-native-${replacableIndicator}`,
    defaultBranch: "main",
  },
} as const;
export type Target = "web" | "native";

export const spinner = ora({ text: "" });
