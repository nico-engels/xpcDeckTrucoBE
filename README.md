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

Swagger 5

## Arquitetura

Arquivo de rotas com os módulos se encontra no src/index.ts.

Inicialmente é necessário criar e logar com um usuário para acessar as
funcionalidades, sendo usado o sistema de tokens JWT após a autenticação que
deve ser informado a cada requisição dos módulos.

Para o mapeamento objeto relacional utilizado TypeORM. Na base de dados utilizado
o sqlite para o controle de usuários e o histórico de jogos, mãos e rodadas.

## API

A documentação Swagger da API pode ser acessada na URL /api-docs.

## Front-end

Criado o projeto `xpcDeckTrucoFE-SPASimple` com um protótipo de implementação
do front consumindo a API.

## Executando

Deve ser definido no arquivo `.env`:

- FIXSTR: Consumido pelo HMAC Update ao gravar a senha dos usuários na base.
  Informar uma string aleatória.
- TOK_SECRET: Secret (string) utilizado ao assinar o token JWT. Informar uma
  string aleatória.
- PREAUTH_VALIDATE_DEVICE: Usar true para deixar apenas a sessão que abriu o
  link pré-autorizado acessar o jogo. Ou false para não realizar essa validação,
  usando apenas o link como chave.
- SP_USER_XT_ADMIN: Senha do usuário administrador.
- SP_USER_XPCUSRCREATOR: Senha do usuário criador de usuários.
- SP_USER_CPU_LIZA (opcional): Senha CPU 1.
- SP_USER_CPU_ROQUE (opcional): Senha CPU 2.

O servidor escuta por padrão nas portas 7777 (https) e 7778 (http). O 
certificado deve ser informado na pasta rec/sslcert/(selfsigned.key e 
selfsigned.crt).

Para criar a base de dados é necessário executar `npm run schema-sync`.

Criar a pasta ./rec/log para o registro das requisições recebidas.

## À Fazer

- Desenvolver funcionalidade dos oponentes CPU.