import { GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

import { games, rounds } from './games';
import { dyndoclient } from './data-source-dyndb';

export async function createGameDyndb(game: games) {
  if (!game.id) {
    game.id = Math.floor(Math.random() * 1024);
  }

  if (!game.startPlay) {
    game.startPlay = new Date();
  }

  const gameDoc = {
    id: game.id,
    player1: game.player1.id,
    player1Username: game.player1.username,
    player2: game.player2.id,
    player2Username: game.player2.username,
    player1Score: game.player1Score,
    player2Score: game.player2Score,
    startPlay: game.startPlay.toISOString(),
    winnerPlayer: game.winnerPlayer,
    endPlay: game.endPlay?.toISOString(),
    rounds: game.rounds,
  };

  const cmd = new PutCommand({
    TableName: 'games',
    Item: gameDoc,
  });

  await dyndoclient.send(cmd);

  return game;
}

export async function getGameByIdDyndb(gameId: number) {
  const cmd = new GetCommand({
    TableName: 'games',
    Key: {
      id: gameId,
    },
  });

  const res = await dyndoclient.send(cmd);

  if (res.Item) {
    return {
      id: res.Item.id,
      player1: {
        id: res.Item.player1,
        username: res.Item.player1Username,
      },
      player2: {
        id: res.Item.player2,
        username: res.Item.player2Username,
      },
      player1Score: res.Item.player1Score,
      player2Score: res.Item.player2Score,
      startPlay: res.Item.startPlay,
      winnerPlayer: res.Item.winnerPlayer,
      endPlay: res.Item.endPlay,
      rounds: res.Item.rounds,
    } as games;
  }
}

export async function listGamesByUsernameDyndb(username: string, active?: boolean) {
  let filterExpr = '(player1Username = :username or player2Username = :username)';

  if (active !== undefined) {
    if (active) {
      filterExpr += ' and attribute_not_exists(endPlay)';
    } else {
      filterExpr += ' and attribute_exists(endPlay)';
    }
  }

  const cmd = new ScanCommand({
    TableName: 'games',
    FilterExpression: filterExpr,
    ExpressionAttributeValues: {
      ':username': username,
    },
  });

  const res = await dyndoclient.send(cmd);

  const ret: games[] = [];
  for (const item of res.Items) {
    ret.push({
      id: item.id,
      player1: {
        id: item.player1,
        username: item.player1Username,
      },
      player2: {
        id: item.player2,
        username: item.player2Username,
      },
      player1Score: item.player1Score,
      player2Score: item.player2Score,
      startPlay: item.startPlay,
      winnerPlayer: item.winnerPlayer,
      endPlay: item.endPlay,
      rounds: item.rounds,
    });
  }

  return ret;
}

export async function createRoundDyndb(round: rounds) {

  if (!round.id) {
    round.id = Math.floor(Math.random() * 1024);
  }
  
  const gameDoc = {
    id: round.game.id,
    player1: round.game.player1.id,
    player1Username: round.game.player1.username,
    player2: round.game.player2.id,
    player2Username: round.game.player2.username,
    player1Score: round.game.player1Score,
    player2Score: round.game.player2Score,
    startPlay: round.game.startPlay.toISOString(),
    winnerPlayer: round.game.winnerPlayer?.id,
    endPlay: round.game.endPlay?.toISOString(),
    rounds: [
      {
        id: round.id,
        player1Cards: round.player1Cards,
        player2Cards: round.player2Cards,
        trumpCard: round.trumpCard,
        starterPlayer: round.starterPlayer.id,
        score: round.score,
        seq: round.seq,
        finished: round.finished,
      },
    ],
  };

  const cmd = new PutCommand({
    TableName: 'games',
    Item: gameDoc,
  });

  await dyndoclient.send(cmd);

  await createKeyMapIdDyndb('roundId-' + round.id, {
    id: round.game.id,
    roundSeq: round.seq,
  });

  return round;
}

export async function getAllRoundsByGameDyndb(gameId: number) {
  const cmd = new GetCommand({
    TableName: 'games',
    Key: {
      id: gameId,
    },
  });

  const res = await dyndoclient.send(cmd);

  if (res.Item) {
    const docGame = res.Item;
    return docGame.rounds.map((round) => ({
      id: round.id,
      player1Cards: round.player1Cards,
      player2Cards: round.player2Cards,
      trumpCard: round.trumpCard,
      starterPlayer: {
        id: round.starterPlayer,
        username: docGame.player1Username === round.starterPlayer ? docGame.player1Username : docGame.player2Username,
      },
      score: round.score,
      seq: round.seq,
      finished: round.finished,
      game: {
        id: docGame.id,
        player1: {
          id: docGame.player1,
          username: docGame.player1Username,
        },
        player2: {
          id: docGame.player2,
          username: docGame.player2Username,
        },
        player1Score: docGame.player1Score,
        player2Score: docGame.player2Score,
        startPlay: docGame.startPlay,
        winnerPlayer: docGame.winnerPlayer,
        endPlay: docGame.endPlay,
      }
    }));
  }
}

export async function getLastRoundByGameDyndb(gameId: number) {
  const cmd = new GetCommand({
    TableName: 'games',
    Key: {
      id: gameId,
    },
  });

  const res = await dyndoclient.send(cmd);

  if (res.Item) {
    const docGame = res.Item;
    const docRound = res.Item.rounds.at(-1);
    return {
      id: docRound.id,
      player1Cards: docRound.player1Cards,
      player2Cards: docRound.player2Cards,
      trumpCard: docRound.trumpCard,
      starterPlayer: {
        id: docRound.starterPlayer,
        username: res.Item.player1Username === docRound.starterPlayer ? res.Item.player1Username : res.Item.player2Username,
      },
      score: docRound.score,
      seq: docRound.seq,
      finished: docRound.finished,
      game: {
        id: docGame.id,
        player1: {
          id: docGame.player1,
          username: docGame.player1Username,
        },
        player2: {
          id: docGame.player2,
          username: docGame.player2Username,
        },
        player1Score: docGame.player1Score,
        player2Score: docGame.player2Score,
        startPlay: docGame.startPlay,
        winnerPlayer: docGame.winnerPlayer,
        endPlay: docGame.endPlay,
      }
    } as rounds;
  }
  
}

export async function getRoundByGameIdRoundSeqDyndb(gameId: number, roundSeq: number)
{
  const game = await getGameByIdDyndb(gameId);
  if (game) {
    const round = game.rounds.find((round) => round.seq === roundSeq);
    if (round) {
      return {
        id: round.id,
        player1Cards: round.player1Cards,
        player2Cards: round.player2Cards,
        trumpCard: round.trumpCard,
        starterPlayer: {
          id: round.starterPlayer,
          username: game.player1.username === round.starterPlayer ? game.player1.username : game.player2.username,
        },
        score: round.score,
        seq: round.seq,
        finished: round.finished,
        game: {
          id: game.id,
          player1: {
            id: game.player1.id,
            username: game.player1.username,
          },
          player2: {
            id: game.player2.id,
            username: game.player2.username,
          },
          player1Score: game.player1Score,
          player2Score: game.player2Score,
          startPlay: game.startPlay,
          winnerPlayer: game.winnerPlayer,
          endPlay: game.endPlay,
        },
        turns: round.turns || []
      } as rounds;
    }
  }
}

export async function createKeyMapIdDyndb(keyId: string, value: any) {
  const cmd = new PutCommand({
    TableName: 'util-key-maps',
    Item: {
      'key-id': keyId,
      value,
    },
  });

  await dyndoclient.send(cmd);
}

export async function getGameIdRoundSeqByRoundIdDyndb(roundId: number)
{
  const cmd = new GetCommand({
    TableName: 'util-key-maps',
    Key: {
      'key-id': 'roundId-' + roundId,
    },
  });

  const res = await dyndoclient.send(cmd);

  if (res.Item) {
    return { 
      gameId: res.Item.value.id as number,
      roundSeq: res.Item.value.roundSeq as number,
    }
  }
}