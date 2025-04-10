import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { afterEach, describe, expect, jest, test } from '@jest/globals';

import { infoGame } from '../../src/controller/game';
import { jwtRequest } from '../../src/router/middlewares';
import { games, rounds } from '../../src/entity/games';
import * as gamesDbModule from '../../src/entity/games-db';

const MockGetGameById = jest.spyOn(gamesDbModule, 'getGameById');

afterEach(() => {
  jest.clearAllMocks();
});

describe('Information of the Game', () => {
  test('Should return sucessfully', async () => {
    const expectInfo = {
      gameId: 7771,
      username: 'anyone',
      gameInfo: {
        player1Id: 13432,
        player1: 'guga',
        player1Score: 0,
        player2Id: 2,
        player2: 'roger',
        player2Score: 6,
        startPlay: new Date(),
        lastPlay: new Date(),
        rounds: [
          {
            id: 67676,
            seq: 8888,
          },
          {
            id: 1,
            seq: 1,
          },
          {
            id: 5564,
            seq: 1212,
          },
        ] as rounds[],
      },
    };
    const req = {
      params: {
        gameId: expectInfo.gameId,
      },
      jwtToken: {
        username: expectInfo.username,
      },
    } as unknown as jwtRequest;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    MockGetGameById.mockResolvedValue({
      id: expectInfo.gameId,
      player1: {
        id: expectInfo.gameInfo.player1Id,
        username: expectInfo.gameInfo.player1,
      },
      player1Score: expectInfo.gameInfo.player1Score,
      player2: {
        id: expectInfo.gameInfo.player2Id,
        username: expectInfo.gameInfo.player2,
      },
      player2Score: expectInfo.gameInfo.player2Score,
      startPlay: expectInfo.gameInfo.startPlay,
      lastPlay: expectInfo.gameInfo.lastPlay,
      rounds: expectInfo.gameInfo.rounds,
    } as games);

    await infoGame(req, res);

    expect(MockGetGameById).toHaveBeenCalledTimes(1);
    expect(MockGetGameById).toHaveBeenCalledWith(expectInfo.gameId);
    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(res.json).toHaveBeenCalledWith({
      id: expectInfo.gameId,
      player1Id: expectInfo.gameInfo.player1Id,
      player1: expectInfo.gameInfo.player1,
      player1Score: expectInfo.gameInfo.player1Score,
      player2Id: expectInfo.gameInfo.player2Id,
      player2: expectInfo.gameInfo.player2,
      player2Score: expectInfo.gameInfo.player2Score,
      startPlay: expectInfo.gameInfo.startPlay,
      lastPlay: expectInfo.gameInfo.lastPlay,
      lastRoundId: expectInfo.gameInfo.rounds.at(-1)?.id,
      lastRoundSeq: expectInfo.gameInfo.rounds.at(-1)?.seq,
    });
  });
});
