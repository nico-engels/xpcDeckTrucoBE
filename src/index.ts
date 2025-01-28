import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fs from 'fs';
import express from 'express';
import https from 'https';

import router from './router';

dotenv.config();

const app = express();

app.use(bodyParser.json());

const privateKey  = fs.readFileSync('rec/sslcert/selfsigned.key', 'utf8');
const certificate = fs.readFileSync('rec/sslcert/selfsigned.crt', 'utf8');
const credentials = { key: privateKey, cert: certificate };

const server = https.createServer(credentials, app);

server.listen(7777, () => {
  console.log('xpdDeck-Truco running');
});

app.use('/', router());
