import { IsNull, Not } from 'typeorm';

import { appDataSource } from '../data-source';
import { games, rounds, turns } from './games';
import { chunkSubstr } from '../util';

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

export function getActions() {
  return ['Gu', 'Ys', 'No', 'Tr', 'Sx', 'Nn', 'Tw'];
}

export function getActionsElevations() {
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

export async function getAllInfoTurnsByRound(roundId: number): Promise<InfoRounds> {
  const round = (
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
            nextPlayerId = round.game.player1.id;
            player1LastAction = '';
            player2LastAction = '';
          } else if (actionsElevate.includes(player2LastAction) && player1LastAction === 'Ys') {
            nextPlayerId = round.game.player2.id;
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

    const possibleActions : string[] = [];
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
        } if (askElevate == 'Nn') {
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
      possibleActions
    };
  }

  return {
    round,
  };
}
