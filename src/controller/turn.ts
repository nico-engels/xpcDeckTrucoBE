import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { createTurn, getActions, getActionsElevations, getAllInfoTurnsByRound, updateRound } from '../entity/games-db';
import { jwtRequest } from '../router/middlewares';

export async function checkTurn(req: Request, res: Response) {
  const roundId = parseInt(req.params.roundId);

  const roundTurns = await getAllInfoTurnsByRound(roundId);

  if (!roundTurns || !roundTurns.round) {
    res.status(StatusCodes.NOT_FOUND).end();
    return;
  }

  const turnFmtArr: {
    id: number;
    seq: number;
    playerId: number;
    player: string;
    cardOrAction: string;
    when: Date;
  }[] = [];
  for (const t of roundTurns.round.turns) {
    turnFmtArr.push({
      id: t.id,
      seq: t.seq,
      playerId: t.player.id,
      player: t.player.username,
      cardOrAction: t.cardOrAction,
      when: t.when,
    });
  }

  let playerCards: string[];
  let playerCardsRemaining: string[];
  if (roundTurns.round.game.player1.id == (req as jwtRequest).jwtToken.userId) {
    playerCards = roundTurns.player1CardsArr;
    playerCardsRemaining = roundTurns.player1CardsRemaining;
  } else if (roundTurns.round.game.player2.id == (req as jwtRequest).jwtToken.userId) {
    playerCards = roundTurns.player2CardsArr;
    playerCardsRemaining = roundTurns.player2CardsRemaining;
  }

  res
    .status(StatusCodes.OK)
    .json({
      roundId: roundTurns.round.id,
      roundSeq: roundTurns.round.seq,
      gameId: roundTurns.round.game.id,
      starterPlayer: roundTurns.round.starterPlayer.id,
      nextPlayerId: roundTurns.nextPlayerId,
      score: roundTurns.round.score,
      trumpCard: roundTurns.round.trumpCard,
      player1Id: roundTurns.round.game.player1.id,
      player1: roundTurns.round.game.player1.username,
      player2Id: roundTurns.round.game.player2.id,
      player2: roundTurns.round.game.player2.username,
      playerCards,
      playerCardsRemaining,
      turnsCount: turnFmtArr.length,
      turns: turnFmtArr,
      TriTurnWinner: roundTurns.TriTurnWinner,
      roundWinner: roundTurns.roundWinner,
      lastTurnSeq: roundTurns.lastTurnSeq,
      possibleActions: roundTurns.possibleActions,
    })
    .end();
}

export async function playTurn(req: Request, res: Response) {
  const { roundId, prevSeq, cardOrAction } = req.body || {};

  if (!roundId || prevSeq === undefined || !cardOrAction) {
    res.status(StatusCodes.CONFLICT).json({ message: 'Invalid request!' }).end();
    return;
  }

  const roundTurns = await getAllInfoTurnsByRound(roundId);

  if (!roundTurns || !roundTurns.round) {
    res.status(StatusCodes.NOT_FOUND).end();
    return;
  }

  let playerCards: Array<string>;
  let playerCardsRemaining: Array<string>;
  if (roundTurns.round.game.player1.id == (req as jwtRequest).jwtToken.userId) {
    playerCards = roundTurns.player1CardsArr;
    playerCardsRemaining = roundTurns.player1CardsRemaining;
  } else if (roundTurns.round.game.player2.id == (req as jwtRequest).jwtToken.userId) {
    playerCards = roundTurns.player2CardsArr;
    playerCardsRemaining = roundTurns.player2CardsRemaining;
  } else {
    res.status(StatusCodes.FORBIDDEN).json({ message: 'You do not participate in this game!' }).end();
    return;
  }

  if (roundTurns.roundWinner) {
    res.status(StatusCodes.CONFLICT).json({ message: 'Round is over!' }).end();
    return;
  }

  if (roundTurns.round.turns.length == 0 && prevSeq !== 0) {
    res.status(StatusCodes.CONFLICT).json({ message: 'Invalid sequence!' }).end();
    return;
  }

  if (roundTurns.round.turns.length && prevSeq !== roundTurns.round.turns.at(-1).seq) {
    res.status(StatusCodes.CONFLICT).json({ message: 'Invalid sequence!' }).end();
    return;
  }

  if (roundTurns.nextPlayerId !== (req as jwtRequest).jwtToken.userId) {
    res.status(StatusCodes.CONFLICT).json({ message: 'Not your turn!' }).end();
    return;
  }

  const actions = getActions();
  const actionsElevations = getActionsElevations();

  if (!playerCards.includes(cardOrAction) && !actions.includes(cardOrAction)) {
    res.status(StatusCodes.CONFLICT).json({ message: 'Invalid card or action!' }).end();
    return;
  }

  if (!playerCardsRemaining.includes(cardOrAction) && !actions.includes(cardOrAction)) {
    res.status(StatusCodes.CONFLICT).json({ message: 'Card already played!' }).end();
    return;
  }

  if (roundTurns.askElevate?.length === 0 && (cardOrAction === 'Ys' || cardOrAction === 'No')) {
    res.status(StatusCodes.CONFLICT).json({ message: 'Aswer for no elevation!' }).end();
    return;
  }

  if (roundTurns.askElevate?.length && !actions.includes(cardOrAction)) {
    res.status(StatusCodes.CONFLICT).json({ message: 'Elevation needs a answer!' }).end();
    return;
  }

  if (actionsElevations.find((x) => x.elevation === cardOrAction)?.score <= roundTurns.round.score) {
    res.status(StatusCodes.CONFLICT).json({ message: 'Elevation already done!' }).end();
    return;
  }

  if (
    actionsElevations.find((x) => x.elevation === cardOrAction)?.score <= actionsElevations.find((x) => x.elevation === roundTurns.askElevate)?.score
  ) {
    res.status(StatusCodes.CONFLICT).json({ message: 'Elevation aswered must be upper!' }).end();
    return;
  }

  if (roundTurns.askElevate?.length && (cardOrAction === 'Ys' || actionsElevations.find((x) => x.elevation === cardOrAction))) {
    roundTurns.round.score = actionsElevations.find((x) => x.elevation === roundTurns.askElevate).score;
    updateRound(roundTurns.round);
  }

  const turn = await createTurn({
    round: { id: roundId },
    seq: prevSeq + 1,
    player: { id: (req as jwtRequest).jwtToken.userId },
    cardOrAction,
    when: new Date(),
  });

  res
    .status(StatusCodes.OK)
    .json({
      id: turn.id,
    })
    .end();
}
