import chalk from 'chalk';

let verbose = false;

export const setVerbose = (value: boolean) => {
  verbose = value;
};

export const debug = (...args: unknown[]) => {
  if (verbose) {
    console.debug(
      `\n${chalk.magenta('DEBUG')}\n`,
      ...args.flatMap((valueToDisplay) => [chalk.magenta('|>'), valueToDisplay, '\n']),
    );
  }
};
