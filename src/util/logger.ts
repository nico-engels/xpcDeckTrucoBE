import logger from 'pino-http';
import fs from 'node:fs';

export default logger({
  redact: {
    paths: ['*.headers.authorization'],
    censor: '[****Censored****]'
  },
  stream: fs.createWriteStream('./rec/log/app.log')
});