import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { createGame } from '../entity/games-db';
import { users } from '../entity/users';
import {
  createUser,
  createPreAuthGame,
  getPreGameByLink,
  getUserByUsername,
  getUserByRpAddress,
  getUserByEmail,
  listPreAuthGame,
  updatePreAuthGame,
  updateUser,
} from '../entity/users-db';
import { newRound } from './round';
import { jwtRequest } from '../router/middlewares';
import { saltRandom, authentication, generateAccessTok } from '../util';

export async function login(req: Request, res: Response) {
  const { username, email, password, rpAddress } = req.body || {};

  if ((username && email) || (username && rpAddress) || (email && rpAddress)) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: 'Login only username, e-mail or xrp-address!' }).end();
    return;
  }

  if (!username && !email && !rpAddress) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: 'Login with username, e-mail or xrp-address!' }).end();
    return;
  }

  if (rpAddress) {
    res.status(StatusCodes.NOT_IMPLEMENTED).end();
    return;
  }

  const user = username ? await getUserByUsername(username) : await getUserByEmail(email);

  if (!user) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Username/E-mail or password not match!' }).end();
    return;
  }

  const expectedHash = authentication(user.salt, password);
  if (user.passwd !== expectedHash) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Username/E-mail or password not match!' }).end();
    return;
  }

  const jwtTok = generateAccessTok(user.username, user.id);

  res
    .status(StatusCodes.OK)
    .json({
      id: user.id,
      jwtTok,
    })
    .end();
}

export async function register(req: Request, res: Response) {
  if ((req as jwtRequest).jwtToken?.username !== 'xpcUsrCreator') {
    res.status(StatusCodes.UNAUTHORIZED).end();
    return;
  }

  const { username, email, rpAddress, password } = req.body || {};

  if (!email && !rpAddress) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: 'Need e-mail or xrp-address!' }).end();
    return;
  }

  let username_valid = username;
  if (!username) {
    if (email) {
      username_valid = email.split('@')[0];
    } else {
      username_valid = rpAddress;
    }
  }

  const existingUsername = await getUserByUsername(username_valid);
  if (existingUsername) {
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({ message: 'Username already registred!' }).end();
    return;
  }

  if (rpAddress) {
    const existingRpAddress = await getUserByRpAddress(rpAddress);
    if (existingRpAddress) {
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({ message: 'Xrp-address already registred!' }).end();
      return;
    }
  }

  if (email) {
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({ message: 'E-mail already registred!' }).end();
      return;
    }
  }

  if (!password || password.length < 6) {
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({ message: 'Password need to be at least 6 caracters!' }).end();
    return;
  }

  const salt = saltRandom();

  const user = await createUser({
    username: username_valid,
    email,
    rpAddress,
    salt,
    passwd: authentication(salt, password),
  });

  const jwtTok = generateAccessTok(user.username, user.id);

  res
    .status(StatusCodes.OK)
    .json({
      id: user.id,
      jwtTok,
      message: 'ok',
    })
    .end();
}

export async function changePassword(req: Request, res: Response) {
  const user = await getUserByUsername((req as jwtRequest).jwtToken.username);
  if (!user) {
    res.status(StatusCodes.CONFLICT).json({ message: `Username '$req.jwtToken.username' not exist!` }).end();
    return;
  }

  const { oldPassword, newPassword } = req.body || {};

  const expectedHash = authentication(user.salt, oldPassword);
  if (user.passwd !== expectedHash) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: 'old password not match!' }).end();
    return;
  }

  if (!newPassword || newPassword.length < 6) {
    res.status(StatusCodes.CONFLICT).json({ message: 'Password need to be at least 6 caracters!' }).end();
    return;
  }

  const salt = saltRandom();

  user.salt = salt;
  user.passwd = authentication(salt, newPassword);

  await updateUser(user);

  res
    .status(StatusCodes.OK)
    .json({
      id: user.id,
      message: 'ok',
    })
    .end();
}

export async function newPreAuthGame(req: Request, res: Response) {
  if ((req as jwtRequest).jwtToken.username !== 'xt-admin') {
    res.status(StatusCodes.UNAUTHORIZED).end();
    return;
  }

  const { player1username, player2username } = req.body || {};

  let player1: users;
  let player2: users;

  if (player1username && player2username) {
    if (player1username === player2username) {
      res.status(StatusCodes.CONFLICT).json({ message: 'Username cannot reference itself!' }).end();
      return;
    } else {
      player1 = await getUserByUsername(player1username);
      player2 = await getUserByUsername(player2username);
    }
  }

  if (!player1 || !player2) {
    res.status(StatusCodes.NOT_FOUND).json({ message: 'Player not found!' }).end();
    return;
  }
  const game = await createGame({
    player1: player1,
    player2: player2,
    player1Score: 0,
    player2Score: 0,
  });
  await newRound(game, 1);
  const newPreGame = await createPreAuthGame({ game });

  res
    .status(StatusCodes.OK)
    .json({
      message: 'ok',
      id: newPreGame.id,
      player1Link: newPreGame.player1Link,
      player2Link: newPreGame.player2Link,
    })
    .end();
}

export async function generatePreGameToken(req: Request, res: Response) {
  const { playerLink, deviceId } = req.body || {};

  if (!playerLink || !deviceId) {
    res.status(StatusCodes.BAD_REQUEST).end();
    return;
  }

  const preGame = await getPreGameByLink(playerLink);
  if (!preGame) {
    res.status(StatusCodes.NOT_FOUND).json({ message: 'Link not found!' }).end();
    return;
  }

  const player = playerLink === preGame.player1Link ? preGame.game.player1 : preGame.game.player2;
  const deviceIdRegistred = playerLink === preGame.player1Link ? preGame.player1DeviceId : preGame.player2DeviceId;

  if (process.env.PREAUTH_VALIDATE_DEVICE === 'true' && deviceIdRegistred && deviceIdRegistred !== deviceId) {
    res.status(StatusCodes.UNAUTHORIZED).end();
    return;
  }

  if (playerLink === preGame.player1Link) {
    preGame.player1DeviceId = deviceId;
  } else {
    preGame.player2DeviceId = deviceId;
  }

  const jwtTok = generateAccessTok(player.username, player.id, preGame.game.id);

  await updatePreAuthGame(preGame);

  res
    .status(StatusCodes.OK)
    .json({
      playerId: player.id,
      player: player.username,
      jwtTok: jwtTok,
      gameId: preGame.game.id,
    })
    .end();
}

export async function resetPreGameToken(req: Request, res: Response) {
  if ((req as jwtRequest).jwtToken.username !== 'xt-admin') {
    res.status(StatusCodes.UNAUTHORIZED).end();
    return;
  }

  const { playerLink } = req.body || {};

  if (!playerLink) {
    res.status(StatusCodes.NOT_FOUND).end();
    return;
  }

  const preGame = await getPreGameByLink(playerLink);

  if (!preGame) {
    res.status(StatusCodes.NOT_FOUND).json({ message: 'Link not found!' }).end();
    return;
  }

  let player: string;
  if (playerLink === preGame.player1Link) {
    preGame.player1DeviceId = null;
    player = 'p1';
  } else {
    preGame.player2DeviceId = null;
    player = 'p2';
  }

  await updatePreAuthGame(preGame);

  res
    .status(StatusCodes.OK)
    .json({
      message: 'ok ' + player,
    })
    .end();
}

export async function listPreAuthGames(req: Request, res: Response) {
  if ((req as jwtRequest).jwtToken.username !== 'xt-admin') {
    res.status(StatusCodes.UNAUTHORIZED).end();
    return;
  }

  const preAuthGames = await listPreAuthGame();

  res
    .status(StatusCodes.OK)
    .json({
      preAuthGamesCount: preAuthGames.length,
      preAuthGames,
    })
    .end();
}
