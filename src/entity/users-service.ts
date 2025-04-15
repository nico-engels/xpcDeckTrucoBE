import { preAuthGames, users } from './users';
import {
  createPreAuthGameRepo,
  createUserRepo,
  getPreGameByLinkRepo,
  getUserByEmailRepo,
  getUserByRpAddressRepo,
  getUserByUsernameRepo,
  listPreAuthGameRepo,
  updatePreAuthGameRepo,
  updateUserRepo,
} from './users-db';
import { createUserDyndb, getUserByEmailDyndb, getUserByUsernameDyndb } from './users-dyndb';
import { appDataSource } from './data-source-db';
import { authentication, saltRandom } from '../util';

export async function getUserByUsername(username: string) {
  if (process.env.MAIN_PERSISTENCE === 'typeorm-sqlite') {
    return await getUserByUsernameRepo(username);
  } else if (process.env.MAIN_PERSISTENCE === 'dynamodb-aws') {
    return await getUserByUsernameDyndb(username);
  } else {
    throw new Error('getUserByUsername is not implemented for this persistence');
  }
}

export async function getUserByRpAddress(rpAddress: string) {
  if (process.env.MAIN_PERSISTENCE === 'typeorm-sqlite') {
    return await getUserByRpAddressRepo(rpAddress);
  } else {
    throw new Error('getUserByRpAddress is not implemented for this persistence');
  }
}

export async function getUserByEmail(email: string) {
  if (process.env.MAIN_PERSISTENCE === 'typeorm-sqlite') {
    return await getUserByEmailRepo(email);
  } else if (process.env.MAIN_PERSISTENCE === 'dynamodb-aws') {
    return await getUserByEmailDyndb(email);
  } else {
    throw new Error('getUserByEmail is not implemented for this persistence');
  }
}

export async function createUser(user: users) {
  if (process.env.MAIN_PERSISTENCE === 'typeorm-sqlite') {
    return await createUserRepo(user);
  } else if (process.env.MAIN_PERSISTENCE === 'dynamodb-aws') {
    return await createUserDyndb(user);
  } else {
    throw new Error('createUser is not implemented for this persistence');
  }
}

export async function updateUser(user: users) {
  if (process.env.MAIN_PERSISTENCE === 'typeorm-sqlite') {
    return await updateUserRepo(user);
  } else {
    throw new Error('updateUser is not implemented for this persistence');
  }
}

export async function createPreAuthGame(pag: preAuthGames) {
  if (process.env.MAIN_PERSISTENCE === 'typeorm-sqlite') {
    return await createPreAuthGameRepo(pag);
  } else {
    throw new Error('createPreAuthGame is not implemented for this persistence');
  }
}

export async function updatePreAuthGame(pag: preAuthGames) {
  if (process.env.MAIN_PERSISTENCE === 'typeorm-sqlite') {
    return await updatePreAuthGameRepo(pag);
  } else {
    throw new Error('updatePreAuthGame is not implemented for this persistence');
  }
}

export async function listPreAuthGame() {
  if (process.env.MAIN_PERSISTENCE === 'typeorm-sqlite') {
    return await listPreAuthGameRepo();
  } else {
    throw new Error('listPreAuthGame is not implemented for this persistence');
  }
}

export async function getPreGameByLink(link: string) {
  if (process.env.MAIN_PERSISTENCE === 'typeorm-sqlite') {
    return await getPreGameByLinkRepo(link);
  } else {
    throw new Error('getPreGameByLink is not implemented for this persistence');
  }
}

export async function createSpecialUsers() {
  if (process.env.MAIN_PERSISTENCE === 'typeorm-sqlite' || process.env.MAIN_PERSISTENCE === 'dynamodb-aws') {
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
    if (process.env.MAIN_PERSISTENCE === 'typeorm-sqlite' && !appDataSource.isInitialized) {
      await appDataSource.initialize();
    }
    for (const usr of usrs) {
      let msg = `Creating user ${usr.username} `;

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
  } else {
    throw new Error('createSpecialUsers is not implemented for this persistence');
  }
}
