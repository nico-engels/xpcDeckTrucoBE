import express from 'express';

import authentication from './authentication';
import game from './game';
import round from './round';
import turn from './turn';

const router = express.Router();

export default function () {
  authentication(router);
  game(router);
  round(router);
  turn(router);

  return router;
}
