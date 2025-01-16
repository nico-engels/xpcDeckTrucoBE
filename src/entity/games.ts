import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';

import { users } from './users';

@Entity()
export class games {
  @PrimaryGeneratedColumn()
  id?: number;

  @ManyToOne(() => users, (user) => user.games1)
  player1?: users;

  @ManyToOne(() => users, (user) => user.games2)
  player2?: users;

  @Column({
    type: 'int',
  })
  player1Score?: number;

  @Column({
    type: 'int',
  })
  player2Score?: number;

  @CreateDateColumn()
  startPlay?: Date;

  @UpdateDateColumn()
  lastPlay?: Date;

  @Column({
    nullable: true,
    type: 'date',
  })
  endPlay?: Date;

  @OneToMany(() => rounds, (round) => round.game)
  rounds?: rounds[];
}

@Entity()
export class rounds {
  @PrimaryGeneratedColumn()
  id?: number;

  @ManyToOne(() => games, (game) => game.rounds)
  game?: games;

  @Column({
    type: 'int',
  })
  seq?: number;

  @Column({
    length: 6,
    type: 'varchar',
  })
  player1Cards?: string;

  @Column({
    length: 6,
    type: 'varchar',
  })
  player2Cards?: string;

  @Column({
    length: 2,
    type: 'varchar',
  })
  trumpCard?: string;

  @ManyToOne(() => users, (user) => user.roundsStarters)
  starterPlayer?: users;

  @Column({
    type: 'boolean',
    nullable: true,
  })
  finished?: boolean;

  @ManyToOne(() => users, (user) => user.roundsWinners)
  winnerPlayer?: users;

  @Column({
    nullable: true,
    type: 'int',
  })
  score?: number;

  @OneToMany(() => turns, (turn) => turn.round)
  turns?: turns[];
}

@Entity()
export class turns {
  @PrimaryGeneratedColumn()
  id?: number;

  @ManyToOne(() => rounds, (round) => round.turns)
  round?: rounds;

  @Column({
    type: 'int',
  })
  seq?: number;

  @ManyToOne(() => users, (user) => user.turns)
  player?: users;

  @Column({
    length: 2,
    type: 'varchar',
  })
  cardOrAction?: string;

  @Column({
    type: 'datetime',
  })
  when?: Date;
}
