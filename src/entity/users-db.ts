import { appDataSource } from '../data-source';
import { users, preAuthGames } from './users';
import { saltRandom } from '../util';

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
  return await appDataSource.getRepository(preAuthGames).find();
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
