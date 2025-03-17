import { appDataSource } from '../data-source';
import { users, preAuthGames } from './users';
import { authentication, saltRandom } from '../util';

export async function getUserByUsername(username: string) {
  return await appDataSource.getRepository(users).findOneBy({ username: username });
}

export async function getUserByRpAddress(rpAddress: string) {
  return await appDataSource.getRepository(users).findOneBy({ rpAddress: rpAddress });
}

export async function getUserByEmail(email: string) {
  return await appDataSource.getRepository(users).findOneBy({ email: email });
}

export async function createUser(user: users) {
  return await appDataSource.getRepository(users).save(user);
}

export async function updateUser(user: users) {
  return await appDataSource.getRepository(users).save(user);
}

export async function createPreAuthGame(pag: preAuthGames) {
  pag.player1Link = saltRandom().substring(0, 15).replaceAll(/[/+]/g, '');
  pag.player2Link = saltRandom().substring(0, 15).replaceAll(/[/+]/g, '');

  return await appDataSource.getRepository(preAuthGames).save(pag);
}

export async function updatePreAuthGame(pag: preAuthGames) {
  return await appDataSource.getRepository(preAuthGames).save(pag);
}

export async function listPreAuthGame() {
  const preGames = await appDataSource.getRepository(preAuthGames).find({
    relations: {
      game: {
        player1: true,
        player2: true,
      },
    },
  });

  const preGamesFmt: {
    id: number;
    player1: string;
    player1Link: string;
    player2: string;
    player2Link: string;
    gameId: number;
  }[] = [];

  for (const pg of preGames) {
    preGamesFmt.push({
      id: pg.id,
      player1: pg.game.player1.username,
      player1Link: pg.player1Link,
      player2: pg.game.player2.username,
      player2Link: pg.player2Link,
      gameId: pg.game.id,
    });
  }

  return preGamesFmt;
}

export async function getPreGameByLink(link: string) {
  return await appDataSource.getRepository(preAuthGames).findOne({
    where: [{ player1Link: link }, { player2Link: link }],
    relations: {
      game: {
        player1: true,
        player2: true,
      },
    },
  });
}

export async function createSpecialUsers() {
  const usrs = [
    {
      username: 'xt-admin',
      plain_passwd: process.env.SP_USER_XT_ADMIN,
      salt: saltRandom(),
    },
    {
      username: 'xpcUsrCreator',
      plain_passwd: process.env.SP_USER_XPCUSRCREATOR,
      salt: saltRandom(),
    },
    {
      username: 'liza(cpu)',
      plain_passwd: process.env.SP_USER_CPU_LIZA,
      salt: saltRandom(),
    },
    {
      username: 'roque(cpu)',
      plain_passwd: process.env.SP_USER_CPU_ROQUE,
      salt: saltRandom(),
    },
  ];

  console.log('Creating special users...');
  if (!appDataSource.isInitialized) {
    await appDataSource.initialize();
  }
  for (const usr of usrs) {
    let msg = `Creating user ${usr.username} = ${usr.plain_passwd} `;

    try {
      await createUser({
        username: usr.username,
        salt: usr.salt,
        passwd: authentication(usr.salt, usr.plain_passwd),
      });

      msg += 'ok';
    } catch (error) {
      msg += `err ${error}`;
    }
    console.log(msg);
  }
}
