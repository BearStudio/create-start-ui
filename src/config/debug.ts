export const debug = (...args: unknown[]) => {
  if (global.isVerbose) {
    console.info(...args);
  }
};
