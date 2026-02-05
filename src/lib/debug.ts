import { styleText } from 'node:util';

let verbose = false;

export const setVerbose = (value: boolean) => {
  verbose = value;
};

export const debug = (...args: unknown[]) => {
  if (verbose) {
    console.debug(
      `\n${styleText('magenta', 'DEBUG')}\n`,
      ...args.flatMap((valueToDisplay) => [styleText('magenta', '|>'), valueToDisplay, '\n']),
    );
  }
};
