import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { games, rounds, turns } from './entity/games';
import { users } from './entity/users';

export const appDataSource = new DataSource({
  type: 'sqlite',
  database: 'test',
  synchronize: true,
  //logging: true,
  entities: [users, games, rounds, turns],
});

appDataSource.initialize();
