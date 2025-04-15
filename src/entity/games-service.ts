import { games, rounds, turns } from './games';
import {
  createGameRepo,
  createRoundRepo,
  createTurnRepo,
  getAllRoundsByGameRepo,
  getGameByIdRepo,
  getLastRoundByGameRepo,
  getRoundByIdRepo,
  listGamesByUsernameRepo,
  updateGameRepo,
  updateRoundRepo,
} from './games-db';
import { createGameDyndb, createRoundDyndb, getAllRoundsByGameDyndb, getGameByIdDyndb, getGameIdRoundSeqByRoundIdDyndb, getLastRoundByGameDyndb, getRoundByGameIdRoundSeqDyndb, listGamesByUsernameDyndb } from './games-dyndb';

export async function createGame(game: games) {
  if (process.env.MAIN_PERSISTENCE === 'typeorm-sqlite') {
    return await createGameRepo(game);
  } else if (process.env.MAIN_PERSISTENCE === 'dynamodb-aws') {
    return await createGameDyndb(game);
  } else {
    throw new Error('createGame is not implemented for this persistence');
  }
}

export async function updateGame(game: games) {
  if (process.env.MAIN_PERSISTENCE === 'typeorm-sqlite') {
    return await updateGameRepo(game);
  } else {
    throw new Error('updateGame is not implemented for this persistence');
  }
}

export async function getGameById(gameId: number) {
  if (process.env.MAIN_PERSISTENCE === 'typeorm-sqlite') {
    return await getGameByIdRepo(gameId);
  } else if (process.env.MAIN_PERSISTENCE === 'dynamodb-aws') {
    return await getGameByIdDyndb(gameId);  
  } else {
    throw new Error('getGameById is not implemented for this persistence');
  }
}

export async function listGamesByUsername(username: string, active?: boolean) {
  if (process.env.MAIN_PERSISTENCE === 'typeorm-sqlite') {
    return await listGamesByUsernameRepo(username, active);
  } else if (process.env.MAIN_PERSISTENCE === 'dynamodb-aws') {
    return await listGamesByUsernameDyndb(username, active);
  } else {
    throw new Error('listGamesByUsername is not implemented for this persistence');
  }
}

export async function createRound(round: rounds) {
  if (process.env.MAIN_PERSISTENCE === 'typeorm-sqlite') {
    return await createRoundRepo(round);
  } else if (process.env.MAIN_PERSISTENCE === 'dynamodb-aws') {
    return await createRoundDyndb(round);
  } else {
    throw new Error('createRound is not implemented for this persistence');
  }
}

export async function updateRound(round: rounds) {
  if (process.env.MAIN_PERSISTENCE === 'typeorm-sqlite') {
    return await updateRoundRepo(round);
  } else {
    throw new Error('updateRound is not implemented for this persistence');
  }
}

export async function getAllRoundsByGame(gameId: number) {
  if (process.env.MAIN_PERSISTENCE === 'typeorm-sqlite') {
    return await getAllRoundsByGameRepo(gameId);
  } else if (process.env.MAIN_PERSISTENCE === 'dynamodb-aws') {
    return await getAllRoundsByGameDyndb(gameId);
  } else {
    throw new Error('getAllRoundsByGame is not implemented for this persistence');
  }
}

export async function getLastRoundByGame(gameId: number) {
  if (process.env.MAIN_PERSISTENCE === 'typeorm-sqlite') {
    return await getLastRoundByGameRepo(gameId);
  } else if (process.env.MAIN_PERSISTENCE === 'dynamodb-aws') {
    return await getLastRoundByGameDyndb(gameId);
  } else {
    throw new Error('getLastRoundByGame is not implemented for this persistence');
  }
}

export async function createTurn(turn: turns) {
  if (process.env.MAIN_PERSISTENCE === 'typeorm-sqlite') {
    return await createTurnRepo(turn);
  } else {
    throw new Error('createTurn is not implemented for this persistence');
  }
}

export async function getRoundById(roundId: number) {
  if (process.env.MAIN_PERSISTENCE === 'typeorm-sqlite') {
    return await getRoundByIdRepo(roundId);
  } else if (process.env.MAIN_PERSISTENCE === 'dynamodb-aws') {
    const gameIdRoundSeq = await getGameIdRoundSeqByRoundIdDyndb(roundId);    
    if (gameIdRoundSeq) {
      return await getRoundByGameIdRoundSeqDyndb(gameIdRoundSeq.gameId, gameIdRoundSeq.roundSeq);
    }
  } else {
    throw new Error('getRoundById is not implemented for this persistence');
  }
}
