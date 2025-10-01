import Conf from 'conf';

type CliConfig = {
  allowTelemetry?: boolean | undefined;
};

export const config = new Conf<CliConfig>({
  projectName: 'create-start-ui',
  schema: {
    allowTelemetry: {
      type: 'boolean',
      default: undefined,
    },
  },
  defaults: {
    allowTelemetry: undefined,
  },
});
