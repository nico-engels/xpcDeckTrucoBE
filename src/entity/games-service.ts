import { games, rounds, turns } from './games';
import {
  createGameRepo,
  createRoundRepo,
  createTurnRepo,
  getAllRoundsByGameRepo,
  getGameByIdRepo,
  getLastRoundByGameRepo,
  getTurnsByRoundRepo,
  listGamesByUsernameRepo,
  updateGameRepo,
  updateRoundRepo,
} from './games-db';

export async function createGame(game: games) {
  return await createGameRepo(game);
}

export async function updateGame(game: games) {
  return await updateGameRepo(game);
}

export async function getGameById(gameId: number) {
  return await getGameByIdRepo(gameId);
}

export async function listGamesByUsername(username: string, active?: boolean) {
  return await listGamesByUsernameRepo(username, active);
}

export async function createRound(round: rounds) {
  return await createRoundRepo(round);
}

export async function updateRound(round: rounds) {
  return await updateRoundRepo(round);
}

export async function getAllRoundsByGame(gameId: number) {
  return await getAllRoundsByGameRepo(gameId);
}

export async function getLastRoundByGame(gameId: number) {
  return await getLastRoundByGameRepo(gameId);
}

export async function createTurn(turn: turns) {
  return await createTurnRepo(turn);
}

export async function getTurnsByRound(roundId: number) {
  return await getTurnsByRoundRepo(roundId);
}
