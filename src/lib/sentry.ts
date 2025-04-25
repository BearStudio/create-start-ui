import { config } from '@/lib/conf.js';
import * as Sentry from '@sentry/node';

export const sentry = Sentry.init({
  dsn: 'https://2512a71f28fa9372bce8824d1ccc038c@sentry.bearstudio.info/4',

  // Tracing
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  enabled: config.get('allowTelemetry'), // disable sentry track if telemetry is disabled
});
