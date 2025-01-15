import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';

import router from './router';

dotenv.config();

const app = express();

app.use(bodyParser.json());

const server = http.createServer(app);

server.listen(7777, () => {
  console.log('xpdDeck-Truco running');
});

app.use('/', router());