import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { games, rounds, turns } from './entity/games';
import { users, preAuthGames } from './entity/users';

export const appDataSource = new DataSource({
  type: 'sqlite',
  database: './rec/bd/db.sqlite3',
  synchronize: true,
  //logging: true,
  entities: [users, games, rounds, turns, preAuthGames],
});

appDataSource.initialize();
