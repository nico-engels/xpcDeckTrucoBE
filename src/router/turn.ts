import { Router } from 'express';

import { checkTurn, playTurn } from '../controller/turn';
import { validadeTok } from './middlewares';

export default function(router: Router)
{
  router.get('/turn/check/:roundId', validadeTok, checkTurn);
  router.post('/turn/play', validadeTok, playTurn);
}