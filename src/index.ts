import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import express from 'express';
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

server_https.listen(7777, () => {
  console.log('xpdDeck-Truco running (7777 https)');
});

server_http.listen(7778, () => {
  console.log('xpdDeck-Truco running (7778 http)');
});

app.use('/', router());
