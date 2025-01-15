import { Router } from 'express';

import { changePassword, login, register } from '../controller/authentication';
import { validadeTok } from './middlewares';

export default function(router: Router)
{
  router.post('/auth/register', register);
  router.post('/auth/login', login);
  router.post('/auth/change_password', validadeTok, changePassword);
}