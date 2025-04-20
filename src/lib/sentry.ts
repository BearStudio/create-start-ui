import { config } from '@/lib/conf.js';
import * as Sentry from '@sentry/node';
import packageJson from '../../package.json' with { type: 'json' };

export const sentry = Sentry.init({
  dsn: 'https://2512a71f28fa9372bce8824d1ccc038c@sentry.bearstudio.info/4',
  release: packageJson.version,

  tracesSampleRate: 1.0,

  // Make sure no events will be sent to sentry
  // if telemetry is disabled
  beforeSend: (event) => {
    if (config.get('allowTelemetry')) return event;
    return null;
  },
});
