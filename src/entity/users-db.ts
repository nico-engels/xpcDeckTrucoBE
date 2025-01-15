import { appDataSource } from '../data-source';
import { users } from './users';

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
