import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { createTurn, getActions, getActionsElevations, getAllInfoTurnsByRound, updateRound } from '../entity/games-db';
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
        possibleActions: roundTurns.possibleActions
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

    if (!roundId || prevSeq === undefined || !cardOrAction) {
      return res.status(StatusCodes.CONFLICT).json({ message: 'Invalid request!' }).end();
    }

    const roundTurns = await getAllInfoTurnsByRound(roundId);

    if (!roundTurns || !roundTurns.round) {
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

    const actions = getActions();
    const actionsElevations = getActionsElevations();

    if (!playerCards.includes(cardOrAction) && !actions.includes(cardOrAction)) {
      return res.status(StatusCodes.CONFLICT).json({ message: 'Invalid card or action!' }).end();
    }

    if (!playerCardsRemaining.includes(cardOrAction) && !actions.includes(cardOrAction)) {
      return res.status(StatusCodes.CONFLICT).json({ message: 'Card already played!' }).end();
    }

    if (roundTurns.askElevate?.length === 0 && (cardOrAction === 'Ys' || cardOrAction === 'No')) {
      return res.status(StatusCodes.CONFLICT).json({ message: 'Aswer for no elevation!' }).end();
    }

    if (roundTurns.askElevate?.length && !actions.includes(cardOrAction)) {
      return res.status(StatusCodes.CONFLICT).json({ message: 'Elevation needs a answer!' }).end();
    }

    if (actionsElevations.find((x) => x.elevation === cardOrAction)?.score <= roundTurns.round.score) {
      return res.status(StatusCodes.CONFLICT).json({ message: 'Elevation already done!' }).end();
    }

    if (
      actionsElevations.find((x) => x.elevation === cardOrAction)?.score <=
      actionsElevations.find((x) => x.elevation === roundTurns.askElevate)?.score
    ) {
      return res.status(StatusCodes.CONFLICT).json({ message: 'Elevation aswered must be upper!' }).end();
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
    /*    
    const turn = { id: 'ppp' };
    console.log(roundTurns);    
    */

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
