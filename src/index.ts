import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import express, { ErrorRequestHandler } from 'express';
import 'express-async-errors';
import { StatusCodes } from 'http-status-codes';
import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';

import router from './router';

dotenv.config();

const app = express();

app.use(bodyParser.json());

const privateKey = fs.readFileSync('rec/sslcert/selfsigned.key', 'utf8');
const certificate = fs.readFileSync('rec/sslcert/selfsigned.crt', 'utf8');
const credentials = { key: privateKey, cert: certificate };

const server_https = https.createServer(credentials, app);
const server_http = http.createServer(app);

const errorHandler: ErrorRequestHandler = (err, req, res) => {
  console.error(`Error handler xpdDeck-Truco: ${err.stack}`);
  res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
};

app.use('/', router());
app.use(errorHandler);

server_https.listen(7777, () => {
  console.log('xpdDeck-Truco running (7777 https)');
});

server_http.listen(7778, () => {
  console.log('xpdDeck-Truco running (7778 http)');
});
