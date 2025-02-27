import { Router } from 'express';

import {
  changePassword,
  generatePreGameToken,
  listPreAuthGames,
  login,
  newPreAuthGame,
  register,
  resetPreGameToken,
} from '../controller/authentication';
import { validadeTok } from './middlewares';

export default function (router: Router) {
  router.post('/auth/register', validadeTok, register);
  router.post('/auth/login', login);
  router.post('/auth/change_password', validadeTok, changePassword);

  router.post('/auth/pre_game/new', validadeTok, newPreAuthGame);
  router.post('/auth/pre_game/consume_link', generatePreGameToken);
  router.post('/auth/pre_game/reset_link', validadeTok, resetPreGameToken);
  router.get('/auth/pre_game/list', validadeTok, listPreAuthGames);
}
