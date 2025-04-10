import { preAuthGames, users } from './users';
import {
  createPreAuthGameRepo,
  createSpecialUsersRepo,
  createUserRepo,
  getPreGameByLinkRepo,
  getUserByEmailRepo,
  getUserByRpAddressRepo,
  getUserByUsernameRepo,
  listPreAuthGameRepo,
  updatePreAuthGameRepo,
  updateUserRepo,
} from './users-db';

export async function getUserByUsername(username: string) {
  return await getUserByUsernameRepo(username);
}

export async function getUserByRpAddress(rpAddress: string) {
  return await getUserByRpAddressRepo(rpAddress);
}

export async function getUserByEmail(email: string) {
  return await getUserByEmailRepo(email);
}

export async function createUser(user: users) {
  return await createUserRepo(user);
}

export async function updateUser(user: users) {
  return await updateUserRepo(user);
}

export async function createPreAuthGame(pag: preAuthGames) {
  return await createPreAuthGameRepo(pag);
}

export async function updatePreAuthGame(pag: preAuthGames) {
  return await updatePreAuthGameRepo(pag);
}

export async function listPreAuthGame() {
  return await listPreAuthGameRepo();
}

export async function getPreGameByLink(link: string) {
  return await getPreGameByLinkRepo(link);
}

export async function createSpecialUsers() {
  await createSpecialUsersRepo();
}
