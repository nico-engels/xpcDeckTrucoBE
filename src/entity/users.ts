import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne } from 'typeorm';

import { games, rounds, turns } from './games';

@Entity()
export class users {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({
    length: 35,
    type: 'varchar',
    unique: true,
  })
  username?: string;

  @Column({
    length: 150,
    nullable: true,
    type: 'varchar',
    unique: true,
  })
  email?: string;

  @Column({
    length: 35,
    nullable: true,
    type: 'varchar',
    unique: true,
  })
  rpAddress?: string;

  @Column({
    length: 200,
    nullable: true,
    type: 'varchar',
  })
  passwd?: string;

  @Column({
    length: 180,
    nullable: true,
    type: 'varchar',
  })
  salt?: string;

  @OneToMany(() => games, (game) => game.player1)
  games1?: games[];

  @OneToMany(() => games, (game) => game.player2)
  games2?: games[];

  @OneToMany(() => rounds, (round) => round.winnerPlayer)
  roundsWinners?: rounds[];

  @OneToMany(() => rounds, (round) => round.starterPlayer)
  roundsStarters?: rounds[];

  @OneToMany(() => turns, (turn) => turn.player)
  turns?: turns[];

  @OneToMany(() => games, (game) => game.winnerPlayer)
  winners?: games[];
}

@Entity()
export class preAuthGames {
  @PrimaryGeneratedColumn()
  id?: number;

  @Column({
    length: 100,
    type: 'varchar',
  })
  player1Link?: string;

  @Column({
    length: 10,
    nullable: true,
    type: 'varchar',
  })
  player1DeviceId?: string;

  @Column({
    length: 100,
    type: 'varchar',
  })
  player2Link?: string;

  @Column({
    length: 10,
    nullable: true,
    type: 'varchar',
  })
  player2DeviceId?: string;

  @ManyToOne(() => games, (game) => game.preAuthGames)
  game?: games;
}
