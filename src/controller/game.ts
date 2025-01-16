import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { createGame, listGamesByUsername } from '../entity/games-db';
import { jwtRequest } from '../router/middlewares';
import { users } from '../entity/users';
import { getUserByUsername } from '../entity/users-db';
import { newRound } from './round';

export async function newGame(req: Request, res: Response) {
  try {
    const { opponentUsername } = req.body;
    let opponentUser: users;

    if (opponentUsername) {
      if (opponentUsername === (req as jwtRequest).jwtToken.username) {
        return res.status(StatusCodes.CONFLICT).json({ message: 'Username cannot reference itself!' }).end();
      } else {
        opponentUser = await getUserByUsername(opponentUsername);
      }
    }

    if (!opponentUser) {
      return res.status(StatusCodes.CONFLICT).json({ message: 'Opponent not found!' }).end();
    }

    const game = await createGame({
      player1: { id: (req as jwtRequest).jwtToken.userId },
      player2: opponentUser,
      player1Score: 0,
      player2Score: 0,
    });

    const round = await newRound(game, 1);

    return res
      .status(StatusCodes.OK)
      .json({
        id: game.id,
        startRoundId: round.id,
        player1Cards: round.player1Cards,
        trumpCard: round.trumpCard,
      })
      .end();
  } catch (error) {
    console.log(error);
    return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
  }
}

export async function listActiveGames(req: Request, res: Response) {
  try {
    const activeGames = await listGamesByUsername((req as jwtRequest).jwtToken.username, true);

    const gameFmt: {
      id: number;
      player1Id: number;
      player1: string;
      player1Score: number;
      player2Id: number;
      player2: string;
      player2Score: number;
      startPlay: Date;
      endPlay: Date;
    }[] = [];

    for (const gss of activeGames) {
      gameFmt.push({
        id: gss.id,
        player1Id: gss.player1.id,
        player1: gss.player1.username,
        player1Score: gss.player1Score,
        player2Id: gss.player2.id,
        player2: gss.player2.username,
        player2Score: gss.player2Score,
        startPlay: gss.startPlay,
        endPlay: gss.endPlay,
      });
    }

    return res
      .status(StatusCodes.OK)
      .json({
        games: gameFmt,
        gamesCount: activeGames.length,
      })
      .end();
  } catch (error) {
    console.log(error);
    return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
  }
}
