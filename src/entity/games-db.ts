import { IsNull, Not } from 'typeorm';

import { appDataSource } from '../data-source';
import { games, rounds, turns } from './games';

export async function createGame(game: games) {
  return await appDataSource.getRepository(games).save(game);
}

export async function updateGame(game: games) {
  return await appDataSource.getRepository(games).save(game);
}

export async function getGameById(gameId: number) {
  return await appDataSource.getRepository(games).findOne({
    where: {
      id: gameId,
    },
    relations: {
      player1: true,
      player2: true,
      rounds: true,
      winnerPlayer: true,
    },
  });
}

export async function listGamesByUsername(username: string, active?: boolean) {
  if (active === undefined) {
    return await appDataSource.getRepository(games).find({
      where: [{ player1: { username } }, { player2: { username } }],
      relations: {
        player1: true,
        player2: true,
      },
    });
  } else {
    if (active) {
      return await appDataSource.getRepository(games).find({
        where: [
          { player1: { username }, endPlay: IsNull() },
          { player2: { username }, endPlay: IsNull() },
        ],
        relations: {
          player1: true,
          player2: true,
        },
      });
    } else {
      return await appDataSource.getRepository(games).find({
        where: [
          { player1: { username }, endPlay: Not(IsNull()) },
          { player2: { username }, endPlay: Not(IsNull()) },
        ],
        relations: {
          player1: true,
          player2: true,
        },
      });
    }
  }
}

export async function createRound(round: rounds) {
  return await appDataSource.getRepository(rounds).save(round);
}

export async function updateRound(round: rounds) {
  return await appDataSource.getRepository(rounds).save(round);
}

export async function getAllRoundsByGame(gameId: number) {
  return await appDataSource.getRepository(rounds).find({
    where: {
      game: { id: gameId },
    },
    relations: {
      game: {
        player1: true,
        player2: true,
      },
      starterPlayer: true,
      winnerPlayer: true,
    },
  });
}

export async function getLastRoundByGame(gameId: number) {
  return (
    await appDataSource.getRepository(rounds).find({
      where: {
        game: { id: gameId },
      },
      relations: {
        game: {
          player1: true,
          player2: true,
        },
        starterPlayer: true,
        winnerPlayer: true,
      },
      order: {
        seq: 'DESC',
      },
      take: 1,
    })
  )[0];
}

export async function createTurn(turn: turns) {
  return await appDataSource.getRepository(turns).save(turn);
}

export async function getTurnsByRound(roundId: number) {
  return (
    await appDataSource.getRepository(rounds).find({
      where: {
        id: roundId,
      },
      relations: {
        game: {
          player1: true,
          player2: true,
        },
        starterPlayer: true,
        winnerPlayer: true,
        turns: {
          player: true,
        },
      },
    })
  )[0];
}
