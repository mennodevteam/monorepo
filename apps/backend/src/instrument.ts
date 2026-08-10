import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: 'https://76bf4569378027276da3862b63e12caf@sentry.hamravesh.com/10301',
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
});
