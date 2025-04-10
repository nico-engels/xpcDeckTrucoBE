import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { games, rounds, turns } from './games';
import { users, preAuthGames } from './users';

export const appDataSource = new DataSource({
  type: 'sqlite',
  database: './rec/bd/db.sqlite3',
  synchronize: true,
  //logging: true,
  entities: [users, games, rounds, turns, preAuthGames],
});

appDataSource.initialize();
