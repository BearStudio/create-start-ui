import { config } from '@/lib/conf.js';

import chalk from 'chalk';

/**
 * function used to log debug message only if --verbose flag is used
 * Act as a wrapper around console.log
 */
export const debug = (...args: unknown[]) => {
  if (config.get('allowTelemetry')) {
    // todo: add sentry usage here
  }

  if (global.isVerbose) {
    console.debug(
      `\n${chalk.magenta('DEBUG')}\n`,
      ...args.flatMap((valueToDisplay) => [chalk.magenta('|>'), valueToDisplay, '\n']),
    );
  }
};
