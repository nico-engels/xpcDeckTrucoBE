import { Router } from 'express';

import { allRounds, finishRound, lastRound } from '../controller/round';
import { validadeTok } from './middlewares';

export default function (router: Router) {
  router.get('/round/all/:gameId', validadeTok, allRounds);
  router.get('/round/last/:gameId', validadeTok, lastRound);
  router.post('/round/end', validadeTok, finishRound);
}
