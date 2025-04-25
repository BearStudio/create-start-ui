import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: 'https://2512a71f28fa9372bce8824d1ccc038c@sentry.bearstudio.info/4',

  // Tracing
  tracesSampleRate: 1.0, // Capture 100% of the transactions
});
