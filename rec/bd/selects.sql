select *
  from users;

select *
  from games
 where 1 = 1
   and id = 19;

update games
   set player2Score = 0
 where 1 = 1
   and id = 19;

-- Rounds
select *
  from rounds
 where 1 = 1
   --and id = 15
   and gameId = 19;  

update rounds
   set winnerPlayerId = null
     , finished = 0
 where 1 = 1
   and id = 6;

-- Turnos (mãos)
select *
  from turns
 where 1 = 1 
   and roundId = 15
 order by "when";

delete from turns where id = 37;