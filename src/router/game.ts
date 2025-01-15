import { Router } from 'express';

import { newGame, listActiveGames } from '../controller/game';
import { validadeTok } from './middlewares';

export default function (router: Router) {
  router.post('/game/new', validadeTok, newGame);
  router.get('/game/listActive', validadeTok, listActiveGames);
}
