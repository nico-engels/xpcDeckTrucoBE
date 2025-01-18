import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { createTurn, getAllInfoTurnsByRound } from '../entity/games-db';
import { jwtRequest } from '../router/middlewares';

export async function checkTurn(req: Request, res: Response) {
  try {
    const roundId = parseInt(req.params.roundId);

    const roundTurns = await getAllInfoTurnsByRound(roundId);

    if (!roundTurns || !roundTurns.round) {
      return res.status(StatusCodes.NOT_FOUND).end();
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

    return res
      .status(StatusCodes.OK)
      .json({
        roundId: roundTurns.round.id,
        gameId: roundTurns.round.game.id,
        starterPlayer: roundTurns.round.starterPlayer.id,
        nextPlayerId: roundTurns.nextPlayerId,
        trumpCard: roundTurns.round.trumpCard,
        player1Id: roundTurns.round.game.player1.id,
        player1: roundTurns.round.game.player1.username,
        player2Id: roundTurns.round.game.player2.id,
        player2: roundTurns.round.game.player2.username,
        playerCards,
        playerCardsRemaining,
        turns: turnFmtArr,
        TriTurnWinner: roundTurns.TriTurnWinner,
        roundWinner: roundTurns.roundWinner,
      })
      .end();
  } catch (error) {
    console.log(error);
    return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
  }
}

export async function playTurn(req: Request, res: Response) {
  try {
    const { roundId, prevSeq, cardOrAction } = req.body;

    const roundTurns = await getAllInfoTurnsByRound(roundId);

    if (!roundTurns) {
      return res.status(StatusCodes.NOT_FOUND).end();
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
      return res.status(StatusCodes.FORBIDDEN).json({ message: 'You do not participate in this game!' }).end();
    }

    if (roundTurns.roundWinner) {
      return res.status(StatusCodes.CONFLICT).json({ message: 'Round is over!' }).end();
    }    

    if (roundTurns.round.turns.length == 0 && prevSeq !== 0) {
      return res.status(StatusCodes.CONFLICT).json({ message: 'Invalid sequence!' }).end();
    }

    if (roundTurns.round.turns.length && prevSeq !== roundTurns.round.turns.at(-1).seq) {
      return res.status(StatusCodes.CONFLICT).json({ message: 'Invalid sequence!' }).end();
    }

    if (roundTurns.nextPlayerId !== (req as jwtRequest).jwtToken.userId) {
      return res.status(StatusCodes.CONFLICT).json({ message: 'Not your turn!' }).end();
    }

    if (!playerCards.includes(cardOrAction)) {
      return res.status(StatusCodes.CONFLICT).json({ message: 'Invalid card!' }).end();
    }

    if (!playerCardsRemaining.includes(cardOrAction)) {
      return res.status(StatusCodes.CONFLICT).json({ message: 'Card already played!' }).end();
    }

    const turn = await createTurn({
      round: { id: roundId },
      seq: prevSeq + 1,
      player: { id: (req as jwtRequest).jwtToken.userId },
      cardOrAction,
      when: new Date(),
    });

    return res
      .status(StatusCodes.OK)
      .json({
        id: turn.id,
      })
      .end();
  } catch (error) {
    console.log(error);
    return res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
  }
}
