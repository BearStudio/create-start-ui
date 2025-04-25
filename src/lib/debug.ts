import chalk from 'chalk';

/**
 * function used to log debug message only if --verbose flag is used
 * Act as a wrapper around console.log
 */
export const debug = (...args: unknown[]) => {
  // todo: add sentry feedback
  if (global.isVerbose) {
    console.debug(
      `\n${chalk.magenta('DEBUG')}\n`,
      ...args.flatMap((valueToDisplay) => [chalk.magenta('|>'), valueToDisplay, '\n']),
    );
  }
};
