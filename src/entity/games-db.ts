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

class InfoRonds {
  round: rounds;
  player1CardsArr?: string[];
  player2CardsArr?: string[];
  player1CardsRemaining?: string[];
  player2CardsRemaining?: string[];
  TriTurnWinner?: turnWin[];
  roundWinner?: turnWin;
  nextPlayerId?: number;
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

  if ((trumpCardNumber % 10) + 1 === player1CardNumber % 10 && (trumpCardNumber % 10) + 1 === player2CardNumber % 10) {
    if (Math.floor(player1CardNumber / 10) > Math.floor(player2CardNumber / 10)) {
      return turnWin.player1;
    } else {
      return turnWin.player2;
    }
  } else if ((trumpCardNumber % 10) + 1 === player1CardNumber % 10) {
    return turnWin.player1;
  } else if ((trumpCardNumber % 10) + 1 === player2CardNumber % 10) {
    return turnWin.player2;
  } else if (player1CardNumber % 10 > player2CardNumber % 10) {
    return turnWin.player1;
  } else if (player2CardNumber % 10 > player1CardNumber % 10) {
    return turnWin.player2;
  }

  return turnWin.draw;
}

export async function getAllInfoTurnsByRound(roundId: number): Promise<InfoRonds> {
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

    let player1LastCardOrAction: string = '';
    let player2LastCardOrAction: string = '';
    const TriTurnWinner: turnWin[] = [];
    let nextPlayerId: number = round.starterPlayer.id;
    let roundWinner: number;

    for (const t of round.turns) {
      if (t.player.id === round.game.player1.id) {
        const remInd = player1CardsRemaining.indexOf(t.cardOrAction);
        if (remInd !== -1) {
          player1CardsRemaining.splice(remInd, 1);
        }

        player1LastCardOrAction = t.cardOrAction;

        if (player1LastCardOrAction === 'Gu') {
          roundWinner = turnWin.player2;
        }
      } else {
        const remInd = player2CardsRemaining.indexOf(t.cardOrAction);
        if (remInd !== -1) {
          player2CardsRemaining.splice(remInd, 1);
        }

        player2LastCardOrAction = t.cardOrAction;

        if (player2LastCardOrAction === 'Gu') {
          roundWinner = turnWin.player1;
        }
      }

      if (!roundWinner && player1LastCardOrAction.length && player2LastCardOrAction.length) {
        const winner = turnWinner(player1LastCardOrAction, player2LastCardOrAction, round.trumpCard);
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

        player1LastCardOrAction = '';
        player2LastCardOrAction = '';
      } else if (player1LastCardOrAction.length) {
        nextPlayerId = round.game.player2.id;
      } else if (player2LastCardOrAction.length) {
        nextPlayerId = round.game.player1.id;
      }
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

    if (roundWinner) {
      nextPlayerId = null;
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
    };
  }

  return {
    round,
  };
}
