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
  try {
    const { username, email, password, rpAddress } = req.body || {};

    if ((username && email) || (username && rpAddress) || (email && rpAddress)) {
      return res.status(StatusCodes.CONFLICT).json({ message: 'Login only username, e-mail or xrp-address!' }).end();
    } else if (!username && !email && !rpAddress) {
      return res.status(StatusCodes.CONFLICT).json({ message: 'Login with username, e-mail or xrp-address!' }).end();
    }

    let user;
    if (username || email) {
      if (username) {
        user = await getUserByUsername(username);
      } else {
        user = await getUserByEmail(email);
      }

      if (!user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Username/E-mail or password not match!' }).end();
      }

      const expectedHash = authentication(user.salt, password);
      if (user.passwd !== expectedHash) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Username/E-mail or password not match!' }).end();
      }
    } else {
      return res.status(StatusCodes.NOT_IMPLEMENTED).end();
    }

    const jwtTok = generateAccessTok(user.username, user.id);

    return res
      .status(StatusCodes.OK)
      .json({
        id: user.id,
        jwtTok,
      })
      .end();
  } catch (error) {
    console.log(error);
    return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
  }
}

export async function register(req: Request, res: Response) {
  try {
    const { username, email, rpAddress, password } = req.body || {};
    let username_valid = username;

    if (!email && !rpAddress && username != 'xt-admin' && username != 'liza(cpu)' && username != 'roque(cpu)') {
      return res.status(StatusCodes.CONFLICT).json({ message: 'Need e-mail or xrp-address!' }).end();
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
      return res.status(StatusCodes.CONFLICT).json({ message: 'Username already registred!' }).end();
    }

    if (rpAddress) {
      const existingRpAddress = await getUserByRpAddress(rpAddress);
      if (existingRpAddress) {
        return res.status(StatusCodes.CONFLICT).json({ message: 'Xrp-address already registred!' }).end();
      }
    }

    if (email) {
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return res.status(StatusCodes.CONFLICT).json({ message: 'E-mail already registred!' }).end();
      }
    }

    if (!password || password.length < 6) {
      return res.status(StatusCodes.CONFLICT).json({ message: 'Passord need to be at least 6 caracters!' }).end();
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

    return res
      .status(StatusCodes.OK)
      .json({
        id: user.id,
        jwtTok,
        message: 'ok',
      })
      .end();
  } catch (error) {
    console.log(error);
    return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
  }
}

export async function changePassword(req: Request, res: Response) {
  try {
    const user = await getUserByUsername((req as jwtRequest).jwtToken.username);
    if (!user) {
      return res.status(StatusCodes.CONFLICT).json({ message: `Username '$req.jwtToken.username' not exist!` }).end();
    }

    const { old_password, new_password } = req.body || {};

    const expectedHash = authentication(user.salt, old_password);
    if (user.passwd !== expectedHash) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'old password not match!' }).end();
    }

    if (!new_password || new_password.length < 6) {
      return res.status(StatusCodes.CONFLICT).json({ message: 'Passord need to be at least 6 caracters!' }).end();
    }

    const salt = saltRandom();

    user.salt = salt;
    user.passwd = authentication(salt, new_password);

    updateUser(user);

    return res
      .status(StatusCodes.OK)
      .json({
        id: user.id,
        message: 'ok',
      })
      .end();
  } catch (error) {
    console.log(error);
    return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
  }
}

export async function newPreAuthGame(req: Request, res: Response) {
  try {
    if ((req as jwtRequest).jwtToken.username !== 'xt-admin') {
      return res.status(StatusCodes.UNAUTHORIZED).end();
    }

    const { player1username, player2username } = req.body || {};

    let player1: users;
    let player2: users;

    if (player1username && player2username) {
      if (player1username === player2username) {
        return res.status(StatusCodes.CONFLICT).json({ message: 'Username cannot reference itself!' }).end();
      } else {
        player1 = await getUserByUsername(player1username);
        player2 = await getUserByUsername(player2username);
      }
    }

    if (!player1 || !player2) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Player not found!' }).end();
    }
    const game = await createGame({
      player1: player1,
      player2: player2,
      player1Score: 0,
      player2Score: 0,
    });
    await newRound(game, 1);
    const newPreGame = await createPreAuthGame({ game: game });

    return res
      .status(StatusCodes.OK)
      .json({
        message: 'ok',
        id: newPreGame.id,
        player1Link: newPreGame.player1Link,
        player2Link: newPreGame.player2Link,
      })
      .end();
  } catch (error) {
    console.log(error);
    return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
  }
}

export async function generatePreGameToken(req: Request, res: Response) {
  try {
    const { playerLink, deviceId } = req.body || {};

    if (!playerLink || !deviceId) {
      return res.status(StatusCodes.NOT_FOUND).end();
    }

    const preGame = await getPreGameByLink(playerLink);

    if (!preGame) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Link not found!' }).end();
    }

    let player: string;
    let playerId: number;
    let jwtTok: string;
    if (playerLink === preGame.player1Link) {
      if (preGame.player1DeviceId && preGame.player1DeviceId !== deviceId) {
        return res.status(StatusCodes.CONFLICT).json({ message: 'Link already consumed!' }).end();
      }
      preGame.player1DeviceId = deviceId;

      player = preGame.game.player1.username;
      playerId = preGame.game.player1.id;
      jwtTok = generateAccessTok(preGame.game.player1.username, preGame.game.player1.id, preGame.game.id);
    } else {
      if (preGame.player2DeviceId && preGame.player2DeviceId !== deviceId) {
        return res.status(StatusCodes.CONFLICT).json({ message: 'Link already consumed!' }).end();
      }
      preGame.player2DeviceId = deviceId;

      player = preGame.game.player2.username;
      playerId = preGame.game.player2.id;
      jwtTok = generateAccessTok(preGame.game.player2.username, preGame.game.player2.id, preGame.game.id);
    }

    await updatePreAuthGame(preGame);

    return res
      .status(StatusCodes.OK)
      .json({
        playerId,
        player,
        jwtTok: jwtTok,
        gameId: preGame.game.id,
      })
      .end();
  } catch (error) {
    console.log(error);
    return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
  }
}

export async function resetPreGameToken(req: Request, res: Response) {
  try {
    if ((req as jwtRequest).jwtToken.username !== 'xt-admin') {
      return res.status(StatusCodes.UNAUTHORIZED).end();
    }

    const { playerLink } = req.body || {};

    if (!playerLink) {
      return res.status(StatusCodes.NOT_FOUND).end();
    }

    const preGame = await getPreGameByLink(playerLink);

    if (!preGame) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: 'Link not found!' }).end();
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

    return res
      .status(StatusCodes.OK)
      .json({
        message: 'ok ' + player,
      })
      .end();
  } catch (error) {
    console.log(error);
    return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
  }
}

export async function listPreAuthGames(req: Request, res: Response) {
  try {
    if ((req as jwtRequest).jwtToken.username !== 'xt-admin') {
      return res.status(StatusCodes.UNAUTHORIZED).end();
    }

    const preAuthGames = await listPreAuthGame();

    return res
      .status(StatusCodes.OK)
      .json({
        preAuthGamesCount: preAuthGames.length,
        preAuthGames,
      })
      .end();
  } catch (error) {
    console.log(error);
    return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
  }
}
