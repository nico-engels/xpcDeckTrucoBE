# xpcDeckTrucoBE - API REST de Jogo de Truco Paulista

Projeto de portifólio de back-end desenvolvido usando Typescript e sqlite.
Usando arquitetura de microserviços para melhor separação da lógica de negócio e
persistência com a apresentação consumindo os endpoints disponibilizados.

Desenvolvido o jogo de Truco Paulista popularmente jogado no sul com o baralho de
40 cartas ([Ref](https://pt.wikipedia.org/wiki/Truco#Truco_paulista)). Implementado
os módulos de autenticação e o motor do jogo, aplicando as regras do Truco: sistema
de pontuação, distribuição de cartas, máquina de estados da mão sendo jogada e
encerramento do jogo.

## Tecnologias

Typescript 5.7

NodeJs 22.2

TypeORM 0.3

Sqlite 5.1

## Arquitetura

Arquivo de rotas com os módulos se encontra no src/index.ts.

Inicialmente é necessário criar e logar com um usuário para acessar as
funcionalidades, sendo usado o sistema de tokens JWT após a autenticação que
deve ser informado a cada requisição dos módulos.

Para o mapeamento objeto relacional utilizado TypeORM. Na base de dados utilizado
o sqlite para o controle de usuários e o histórico de jogos, mãos e rodadas.

## Front-end

Criado o projeto `xpcDeckTrucoFE-SPASimple` com um protótipo de implementação
do front consumindo a API.

## Executando

Deve ser definido no arquivo `.env`:

- TOK_SECRET: Secret (string) utilizado ao assinar o token JWT. Informar uma
  string aleatória.
- FIXSTR: Consumido pelo HMAC Update ao gravar a senha dos usuários na base.
  Informar uma string aleatória.

O servidor escuta nas portas 7777 (https) e 7778 (http). O certificado deve ser
informado na pasta rec/sslcert/(selfsigned.key e selfsigned.crt).

## À Fazer

- Testes automatizados (Iniciado usando o Jest).
- Documentação dos endpoints (Swagger).
