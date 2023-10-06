import unhandled from 'cli-handle-unhandled';
import terminalImage from 'terminal-image';

import { fileURLToPath } from 'node:url';

export default async () => {
  unhandled();

  const logoUrl = new URL('../assets/startui-logo.png', import.meta.url);

  console.clear();
  console.log();
  console.log(
    await terminalImage.file(fileURLToPath(logoUrl.toString()), {
      height: 10,
    })
  );
  console.log();
};
