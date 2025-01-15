import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { createUser, updateUser,
         getUserByUsername, getUserByRpAddress, getUserByEmail } from '../entity/users-db';
import { saltRandom, authentication, generateAccessTok } from '../util';

export async function login(req: Request, res: Response)
{
  try {
    const { username, email, password, rpAddress } = req.body;

    if ((username && email) || (username && rpAddress) || (email && rpAddress)) {
      return res.status(StatusCodes.CONFLICT)
                .json({ message: 'Login only username, e-mail or xrp-address!' })
                .end();
    } else if (!username && !email && !rpAddress) {
      return res.status(StatusCodes.CONFLICT)
                .json({ message: 'Login with username, e-mail or xrp-address!' })
                .end();
    }

    let user;
    if (username || email) {
      if (username) {
        user = await getUserByUsername(username);
      } else {
        user = await getUserByEmail(email);
      }

      if (!user) {
        return res.status(StatusCodes.UNAUTHORIZED)
                  .json({ message: 'Username/E-mail or password not match!' })
                  .end();
      }

      const expectedHash = authentication(user.salt, password);
      if (user.passwd !== expectedHash) {
        return res.status(StatusCodes.UNAUTHORIZED)
                  .json({ message: 'Username/E-mail or password not match!' })
                  .end();
      }
    }
    else {
      return res.status(StatusCodes.NOT_IMPLEMENTED)
                .end();
    }

    const jwt_tok = generateAccessTok(user.username, user.id);

    return res.status(StatusCodes.OK).json({
      id: user.id,
      jwt_tok
    }).end();

  } catch (error) {
    console.log(error);
    return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
  }
}

export async function register(req: Request, res: Response)
{
  try {
    const { username, email, rpAddress, password } = req.body;
    let username_valid = username;

    if (!email && !rpAddress && username != 'liza(cpu)' && username != 'roque(cpu)') {
      return res.status(StatusCodes.CONFLICT)
                .json({ message: 'Need e-mail or xrp-address!' })
                .end();
    }

    if (!username) {
      if (email) {
        username_valid = email.substr(0, 35);
      } else {
        username_valid = rpAddress;
      }
    }

    const existingUsername = await getUserByUsername(username_valid);
    if (existingUsername) {
      return res.status(StatusCodes.CONFLICT)
                .json({ message: 'Username already registred!' })
                .end();
    }

    if (rpAddress) {
      const existingRpAddress = await getUserByRpAddress(rpAddress);
      if (existingRpAddress) {
        return res.status(StatusCodes.CONFLICT)
                  .json({ message: 'Xrp-address already registred!' })
                  .end();
      }
    }

    if (email) {
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return res.status(StatusCodes.CONFLICT)
                  .json({ message: 'E-mail already registred!' })
                  .end();
      }
    }

    if (!password || password.length < 6) {
      return res.status(StatusCodes.CONFLICT)
                .json({ message: 'Passord need to be at least 6 caracters!' })
                .end();
    }

    const salt = saltRandom();

    const user = await createUser({
      username: username_valid,
      email,
      rpAddress,
      salt,
      passwd: authentication(salt, password)
    });

    const jwt_tok = generateAccessTok(user.username, user.id);

    return res.status(StatusCodes.OK).json({
      id: user.id,
      jwt_tok,
      message: 'ok'
    }).end();
  } catch (error) {
    console.log(error);
    return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
  }
}

export async function changePassword(req: Request, res: Response)
{
  try {

    const user = await getUserByUsername(req.jwtToken.username);
    if (!user) {
      return res.status(StatusCodes.CONFLICT)
                .json({ message: `Username '$req.jwtToken.username' not exist!` })
                .end();
    }

    const { old_password, new_password } = req.body;

    const expectedHash = authentication(user.salt, old_password);
    if (user.passwd !== expectedHash) {
      return res.status(StatusCodes.UNAUTHORIZED)
                .json({ message: 'old password not match!' })
                .end();
    }

    if (!new_password || new_password.length < 6) {
      return res.status(StatusCodes.CONFLICT)
                .json({ message: 'Passord need to be at least 6 caracters!' })
                .end();
    }

    const salt = saltRandom();

    user.salt = salt;
    user.passwd = authentication(salt, new_password);

    updateUser(user);

    return res.status(StatusCodes.OK).json({
      id: user.id,
      message: 'ok'
    }).end();

  } catch (error) {
    console.log(error);
    return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
  }
}