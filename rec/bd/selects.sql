select *
  from users;

delete from users where id = 17;

select *
  from games
 where 1 = 1
   and id = 21;

update games
   set winnerPlayerId = 21
 where 1 = 1
   and id = 19;

-- Rounds
select *
  from rounds
 where 1 = 1
   --and id = 16
   and gameId = 21
;  

update rounds
   set score = 3
 where 1 = 1
   and id = 16;

-- Turnos (mãos)
select *
  from turns
 where 1 = 1 
   and roundId = 15
 order by "when";

delete from turns where id = 37;

-- Geração de links de acesso fácil
select *
  from pre_auth_games;