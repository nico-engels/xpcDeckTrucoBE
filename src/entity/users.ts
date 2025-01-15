import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';

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
}
