import { Router } from 'express';

import { infoGame, listActiveGames, newGame } from '../controller/game';
import { validadeTok } from './middlewares';

export default function (router: Router) {
  router.post('/game/new', validadeTok, newGame);
  router.get('/game/info/:gameId', validadeTok, infoGame);
  router.get('/game/list_active', validadeTok, listActiveGames);
}
