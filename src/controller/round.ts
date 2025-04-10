import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { games, rounds } from '../entity/games';
import { getAllRoundsByGame, getLastRoundByGame, updateGame, updateRound, createRound } from '../entity/games-service';
import { jwtRequest } from '../router/middlewares';
import { chunkSubstr } from '../util';
import { allInfoTurnsByRound, turnWin } from './turn';

export function generateTrucoDeckCards(count: number) {
  /*  Truco Paulista 40 cartas - Codificação
          4  5  6  7  Q  J  K  A  2  3
      ♦   0  1  2  3  4  5  6  7  8  9
      ♠  10 11 12 13 14 15 16 17 18 19
      ♥  20 21 22 23 24 25 26 27 28 29
      ♣  30 31 32 33 34 35 36 37 38 39
  */
  const cardsNumbers = new Set<number>();
  while (cardsNumbers.size < count) cardsNumbers.add(Math.floor(Math.random() * 40));

  const ranks: string[] = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];
  const suits: string[] = ['♦', '♠', '♥', '♣'];

  const cards: string[] = [];
  cardsNumbers.forEach((value) => {
    cards.push(ranks[value % 10] + suits[Math.floor(value / 10)]);
  });

  return cards;
}

export async function newRound(game: games, newSeq: number, newStarterPlayer?: number) {
  const cards: string[] = generateTrucoDeckCards(7);

  const player1Cards = cards[0] + cards[1] + cards[2];
  const player2Cards = cards[3] + cards[4] + cards[5];
  const trumpCard = cards[6];

  if (newStarterPlayer === undefined) {
    newStarterPlayer = Math.floor(Math.random() * 2) ? game.player1.id : game.player2.id;
  }

  const round = await createRound({
    game,
    player1Cards,
    player2Cards,
    trumpCard,
    starterPlayer: { id: newStarterPlayer },
    score: 1,
    seq: newSeq,
    finished: false,
  });

  return round;
}

export async function finishRound(req: Request, res: Response) {
  const { roundId } = req.body || {};

  if (!roundId) {
    res.status(StatusCodes.NOT_FOUND).json({ message: 'Need Round!' }).end();
    return;
  }

  const roundTurns = await allInfoTurnsByRound(roundId);

  if (!roundTurns) {
    res.status(StatusCodes.NOT_FOUND).end();
    return;
  }

  if (
    roundTurns.round.game.player1.id !== (req as jwtRequest).jwtToken.userId &&
    roundTurns.round.game.player2.id !== (req as jwtRequest).jwtToken.userId
  ) {
    res.status(StatusCodes.FORBIDDEN).json({ message: 'You do not participate in this game!' }).end();
    return;
  }

  if (roundTurns.round.finished) {
    res.status(StatusCodes.CONFLICT).json({ message: 'Round already finished!' }).end();
    return;
  }

  if (!roundTurns.roundWinner) {
    res.status(StatusCodes.CONFLICT).json({ message: 'Round is not over!' }).end();
    return;
  }

  let winnerId: number;
  if (roundTurns.roundWinner === turnWin.player1) {
    winnerId = roundTurns.round.game.player1.id;
    roundTurns.round.game.player1Score = Math.min(roundTurns.round.game.player1Score + roundTurns.round.score, 12);
  } else if (roundTurns.roundWinner === turnWin.player2) {
    winnerId = roundTurns.round.game.player2.id;
    roundTurns.round.game.player2Score = Math.min(roundTurns.round.game.player2Score + roundTurns.round.score, 12);
  }

  if (roundTurns.round.game.player1Score === 12 || roundTurns.round.game.player2Score === 12) {
    roundTurns.round.game.endPlay = new Date();
    roundTurns.round.game.winnerPlayer = { id: winnerId };
  }

  let nextStartPlayerId: number;
  if (roundTurns.round.starterPlayer.id === roundTurns.round.game.player1.id) {
    nextStartPlayerId = roundTurns.round.game.player2.id;
  } else {
    nextStartPlayerId = roundTurns.round.game.player1.id;
  }

  roundTurns.round.finished = true;
  roundTurns.round.winnerPlayer = { id: winnerId };

  await updateRound(roundTurns.round);
  await updateGame(roundTurns.round.game);

  let newRoundSeq: rounds;
  let playerCards: string;
  let nextRound:
    | {
        id: number;
        seq: number;
        playerCards: string;
        trumpCard: string;
        startPlayerId: number;
      }
    | undefined;
  if (roundTurns.round.game.player1Score !== 12 && roundTurns.round.game.player2Score !== 12) {
    newRoundSeq = await newRound(roundTurns.round.game, roundTurns.round.seq + 1, nextStartPlayerId);

    if (roundTurns.round.game.player1.id === (req as jwtRequest).jwtToken.userId) {
      playerCards = newRoundSeq.player1Cards;
    } else {
      playerCards = newRoundSeq.player2Cards;
    }

    nextRound = {
      id: newRoundSeq.id,
      seq: newRoundSeq.seq,
      playerCards,
      trumpCard: newRoundSeq.trumpCard,
      startPlayerId: nextStartPlayerId,
    };
  }

  res.status(StatusCodes.OK).json({
    roundId,
    winnerId,
    finished: true,
    nextRound,
  });
}

export async function allRounds(req: Request, res: Response) {
  if (!req.params.gameId || Number.isNaN(parseInt(req.params.gameId))) {
    res.status(StatusCodes.NOT_FOUND).json({ message: 'Need Game!' }).end();
    return;
  }

  const allRounds = await getAllRoundsByGame(parseInt(req.params.gameId));

  if (!allRounds) {
    res.status(StatusCodes.NOT_FOUND).end();
    return;
  }

  const roundsFmt: {
    id: number;
    seq: number;
    playerCards: string[];
    trumpCard: string;
    score: number;
    starterPlayer: number;
    winnerPlayer: number;
  }[] = [];
  for (const r of allRounds) {
    let playerCards: string[];
    if (r.game.player1.id == (req as jwtRequest).jwtToken.userId) {
      playerCards = chunkSubstr(r.player1Cards, 2);
    } else if (r.game.player2.id == (req as jwtRequest).jwtToken.userId) {
      playerCards = chunkSubstr(r.player2Cards, 2);
    }

    roundsFmt.push({
      id: r.id,
      seq: r.seq,
      playerCards,
      trumpCard: r.trumpCard,
      score: r.score,
      starterPlayer: r.starterPlayer.id,
      winnerPlayer: r.winnerPlayer?.id,
    });
  }

  res
    .status(StatusCodes.OK)
    .json({
      roundsCount: roundsFmt.length,
      rounds: roundsFmt,
    })
    .end();
}

export async function lastRound(req: Request, res: Response) {
  if (!req.params.gameId || Number.isNaN(parseInt(req.params.gameId))) {
    res.status(StatusCodes.NOT_FOUND).json({ message: 'Need Game!' }).end();
    return;
  }

  const lastRound = await getLastRoundByGame(parseInt(req.params.gameId));

  if (!lastRound) {
    res.status(StatusCodes.NOT_FOUND).end();
    return;
  }

  let playerCards: string[];
  if (lastRound.game.player1.id == (req as jwtRequest).jwtToken.userId) {
    playerCards = chunkSubstr(lastRound.player1Cards, 2);
  } else if (lastRound.game.player2.id == (req as jwtRequest).jwtToken.userId) {
    playerCards = chunkSubstr(lastRound.player2Cards, 2);
  }

  res
    .status(StatusCodes.OK)
    .json({
      id: lastRound.id,
      seq: lastRound.seq,
      playerCards,
      trumpCard: lastRound.trumpCard,
      starterPlayer: lastRound.starterPlayer.id,
      winnerPlayer: lastRound.winnerPlayer?.id,
      score: lastRound.score,
    })
    .end();
}
