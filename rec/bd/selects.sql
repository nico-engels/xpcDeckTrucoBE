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

select *
  from rounds
 where 1 = 1
   and id = 7;  

update rounds
   set winnerPlayerId = null
     , finished = 0
 where 1 = 1
   and id = 6;

select *
  from turns
 where 1 = 1 
   and roundId = 7;



/*
"id","player1Score","player2Score","startPlay","lastPlay","endPlay","player1Id","player2Id"
19,0,0,"2025-01-06 04:06:52","2025-01-06 04:06:52",,21,19


*/