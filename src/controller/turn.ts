import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { createTurn, getRoundById, updateRound } from '../entity/games-service';
import { jwtRequest } from '../router/middlewares';
import { chunkSubstr } from '../util';
import { rounds } from '../entity/games';

export enum turnWin {
  draw,
  player1,
  player2,
}

class InfoRounds {
  round: rounds;
  player1CardsArr?: string[];
  player2CardsArr?: string[];
  player1CardsRemaining?: string[];
  player2CardsRemaining?: string[];
  TriTurnWinner?: turnWin[];
  roundWinner?: turnWin;
  nextPlayerId?: number;
  askElevate?: string;
  lastTurnSeq?: number;
  possibleActions?: string[];
}

function turnWinner(player1Card: string, player2Card: string, trumpCard: string) {
  /*  Truco Paulista 40 cartas - Codificação
          4  5  6  7  Q  J  K  A  2  3
      ♦   0  1  2  3  4  5  6  7  8  9
      ♠  10 11 12 13 14 15 16 17 18 19
      ♥  20 21 22 23 24 25 26 27 28 29
      ♣  30 31 32 33 34 35 36 37 38 39
  */
  const ranks: string[] = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];
  const suits: string[] = ['♦', '♠', '♥', '♣'];

  const player1CardNumber = ranks.indexOf(player1Card[0]) + suits.indexOf(player1Card[1]) * 10;
  const player2CardNumber = ranks.indexOf(player2Card[0]) + suits.indexOf(player2Card[1]) * 10;
  const trumpCardNumber = ranks.indexOf(trumpCard[0]) + suits.indexOf(trumpCard[1]) * 10;

  if ((trumpCardNumber + 1) % 10 === player1CardNumber % 10 && (trumpCardNumber + 1) % 10 === player2CardNumber % 10) {
    if (Math.floor(player1CardNumber / 10) > Math.floor(player2CardNumber / 10)) {
      return turnWin.player1;
    } else {
      return turnWin.player2;
    }
  } else if ((trumpCardNumber + 1) % 10 === player1CardNumber % 10) {
    return turnWin.player1;
  } else if ((trumpCardNumber + 1) % 10 === player2CardNumber % 10) {
    return turnWin.player2;
  } else if (player1CardNumber % 10 > player2CardNumber % 10) {
    return turnWin.player1;
  } else if (player2CardNumber % 10 > player1CardNumber % 10) {
    return turnWin.player2;
  }

  return turnWin.draw;
}

function getActions() {
  return ['Gu', 'Ys', 'No', 'Tr', 'Sx', 'Nn', 'Tw'];
}

function getActionsElevations() {
  return [
    {
      elevation: 'Tr',
      score: 3,
    },
    {
      elevation: 'Sx',
      score: 6,
    },
    {
      elevation: 'Nn',
      score: 9,
    },
    {
      elevation: 'Tw',
      score: 12,
    },
  ];
}

export async function allInfoTurnsByRound(roundId: number): Promise<InfoRounds> {
  const round = await getRoundById(roundId);

  if (round) {
    const player1CardsArr = chunkSubstr(round.player1Cards, 2);
    const player2CardsArr = chunkSubstr(round.player2Cards, 2);

    const player1CardsRemaining: string[] = player1CardsArr.slice();
    const player2CardsRemaining: string[] = player2CardsArr.slice();

    let player1LastCard: string = '';
    let player2LastCard: string = '';
    let player1LastAction: string = '';
    let player2LastAction: string = '';
    const TriTurnWinner: turnWin[] = [];
    let nextPlayerId: number = round.starterPlayer.id;
    let roundWinner: number;
    let askElevate: string;
    let lastTurnSeq: number = 0;

    const actionsElevate = getActionsElevations().map((x) => x.elevation);

    for (const t of round.turns) {
      askElevate = '';

      if (t.player.id === round.game.player1.id) {
        const remInd = player1CardsRemaining.indexOf(t.cardOrAction);
        if (remInd !== -1) {
          player1CardsRemaining.splice(remInd, 1);
        }

        if (t.cardOrAction === 'Gu') {
          roundWinner = turnWin.player2;
        } else if (getActions().includes(t.cardOrAction)) {
          player1LastAction = t.cardOrAction;
        } else {
          player1LastCard = t.cardOrAction;
        }
      } else {
        const remInd = player2CardsRemaining.indexOf(t.cardOrAction);
        if (remInd !== -1) {
          player2CardsRemaining.splice(remInd, 1);
        }

        if (t.cardOrAction === 'Gu') {
          roundWinner = turnWin.player1;
        } else if (getActions().includes(t.cardOrAction)) {
          player2LastAction = t.cardOrAction;
        } else {
          player2LastCard = t.cardOrAction;
        }
      }

      if (player1LastCard.length && player2LastCard.length) {
        const winner = turnWinner(player1LastCard, player2LastCard, round.trumpCard);
        TriTurnWinner.push(winner);

        switch (winner) {
          case turnWin.player1:
            nextPlayerId = round.game.player1.id;
            break;

          case turnWin.player2:
            nextPlayerId = round.game.player2.id;
            break;

          case turnWin.draw:
            nextPlayerId = round.starterPlayer.id;
            break;
        }

        player1LastCard = '';
        player2LastCard = '';
      } else if (player1LastCard.length) {
        nextPlayerId = round.game.player2.id;
      } else if (player2LastCard.length) {
        nextPlayerId = round.game.player1.id;
      }

      if (player1LastAction.length && player2LastAction.length) {
        if (player2LastAction === 'No') {
          roundWinner = turnWin.player1;
          player1LastAction = '';
          player2LastAction = '';
        } else if (player1LastAction === 'No') {
          roundWinner = turnWin.player2;
          player1LastAction = '';
          player2LastAction = '';
        } else {
          if (actionsElevate.includes(player1LastAction) && player2LastAction === 'Ys') {
            nextPlayerId = player1CardsRemaining.length === player2CardsRemaining.length ? round.game.player1.id : round.game.player2.id;
            player1LastAction = '';
            player2LastAction = '';
          } else if (actionsElevate.includes(player2LastAction) && player1LastAction === 'Ys') {
            nextPlayerId = player1CardsRemaining.length === player2CardsRemaining.length ? round.game.player2.id : round.game.player1.id;
            player1LastAction = '';
            player2LastAction = '';
          } else {
            const pl1act = actionsElevate.indexOf(player1LastAction);
            const pl2act = actionsElevate.indexOf(player2LastAction);

            if (pl1act < pl2act) {
              nextPlayerId = round.game.player1.id;
              player1LastAction = '';
              askElevate = player2LastAction;
            } else {
              nextPlayerId = round.game.player2.id;
              player2LastAction = '';
              askElevate = player1LastAction;
            }
          }
        }
      } else if (player1LastAction.length) {
        nextPlayerId = round.game.player2.id;
        askElevate = player1LastAction;
      } else if (player2LastAction.length) {
        nextPlayerId = round.game.player1.id;
        askElevate = player2LastAction;
      }

      lastTurnSeq = t.seq;
    }

    if (!roundWinner && TriTurnWinner.length >= 2) {
      if (TriTurnWinner.filter((x) => x === turnWin.player1).length == 2) {
        roundWinner = turnWin.player1;
      } else if (TriTurnWinner.filter((x) => x === turnWin.player2).length == 2) {
        roundWinner = turnWin.player2;
      } else if (
        TriTurnWinner[0] !== turnWin.draw &&
        (TriTurnWinner[1] === turnWin.draw || (TriTurnWinner.length === 3 && TriTurnWinner[2] === turnWin.draw))
      ) {
        roundWinner = TriTurnWinner[0];
      } else if (TriTurnWinner[0] === turnWin.draw && TriTurnWinner[1] !== turnWin.draw) {
        roundWinner = TriTurnWinner[1];
      } else if (
        TriTurnWinner.length === 3 &&
        TriTurnWinner[0] === turnWin.draw &&
        TriTurnWinner[1] === turnWin.draw &&
        TriTurnWinner[2] !== turnWin.draw
      ) {
        roundWinner = TriTurnWinner[2];
      } else if (
        TriTurnWinner.length === 3 &&
        TriTurnWinner[0] === turnWin.draw &&
        TriTurnWinner[1] === turnWin.draw &&
        TriTurnWinner[2] === turnWin.draw
      ) {
        if (round.starterPlayer.id === round.game.player1.id) {
          roundWinner = turnWin.player1;
        } else {
          roundWinner = turnWin.player2;
        }
      }
    }

    const possibleActions: string[] = [];
    if (roundWinner) {
      nextPlayerId = null;
    } else {
      if (askElevate) {
        possibleActions.push('Ys');
        possibleActions.push('No');

        if (askElevate == 'Tr') {
          possibleActions.push('Sx');
        } else if (askElevate == 'Sx') {
          possibleActions.push('Nn');
        }
        if (askElevate == 'Nn') {
          possibleActions.push('Tw');
        }
      } else if (!round.turns.length || (round.turns.length && round.turns.at(-1).cardOrAction != 'Ys')) {
        if (round.score == 1) {
          possibleActions.push('Tr');
        } else if (round.score == 3) {
          possibleActions.push('Sx');
        } else if (round.score == 6) {
          possibleActions.push('Nn');
        } else if (round.score == 9) {
          possibleActions.push('Tw');
        }
      }
      possibleActions.push('Gu');
    }

    return {
      round,
      player1CardsArr,
      player2CardsArr,
      player1CardsRemaining,
      player2CardsRemaining,
      TriTurnWinner,
      roundWinner,
      nextPlayerId,
      askElevate,
      lastTurnSeq,
      possibleActions,
    };
  }

  return {
    round,
  };
}

export async function checkTurn(req: Request, res: Response) {
  const roundId = parseInt(req.params.roundId);

  const roundTurns = await allInfoTurnsByRound(roundId);

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

  const roundTurns = await allInfoTurnsByRound(roundId);

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
