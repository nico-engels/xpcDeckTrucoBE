import crypto from 'crypto';
import jwt from 'jsonwebtoken';

export function saltRandom() {
  return crypto.randomBytes(128).toString('base64');
}

export function authentication(salt: string, password: string) {
  return crypto.createHmac('sha256', [salt, password].join('/')).update(process.env.FIXSTR).digest('hex');
}

export function generateAccessTok(username: string, userId: number, gameId?: number): string {
  return jwt.sign({ username, userId, gameId }, process.env.TOK_SECRET, {
    expiresIn: '3d',
  });
}

export function chunkSubstr(str: string, size: number) {
  const numChunks = Math.ceil(str.length / size);
  const chunks = new Array<string>(numChunks);

  for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
    chunks[i] = str.substring(o, o + size);
  }

  return chunks;
}
