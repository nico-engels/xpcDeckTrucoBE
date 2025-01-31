import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt, { JwtPayload } from 'jsonwebtoken';

export interface jwtUserIdPayload extends JwtPayload {
  username: string;
  userId: number;
  gameId?: number;
}

export interface jwtRequest extends Request {
  jwtToken: jwtUserIdPayload;
}

export async function validadeTok(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.header('Authorization')?.replace(/^Bearer /, '');
    if (!token || token === 'undefined') {
      return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Access denied' }).end();
    }

    const decoded = jwt.verify(token, process.env.TOK_SECRET) as jwtUserIdPayload;
    (req as jwtRequest).jwtToken = {
      username: decoded.username,
      userId: decoded.userId,
      gameId: decoded.gameId,
    };
  } catch (error) {
    console.log(error);
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid token' }).end();
  }

  return next();
}
