import { Request, Response } from 'express';
import { describe, expect, jest, test } from '@jest/globals';

import { login } from '../../src/controller/authentication';
import { users } from '../../src/entity/users';
import * as userDbModule from '../../src/entity/users-db';
import * as utilModule from '../../src/util';

describe('login', () => {
  test('Should login sucessfully', async () => {

    const expectInfo = {
      id: 775,
      username: 'testUser',
      passwd: 'masterSec123',
      salt: 'salty21',
      jwt: 'jwtTok&8'
    }

    const req = {
      body: {
        username: expectInfo.username,
        password: expectInfo.passwd
      }
    } as Request;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      sendStatus: jest.fn(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;
    const userDb = {
        username: expectInfo.username,
        id: expectInfo.id,
        passwd: expectInfo.passwd,
        salt: expectInfo.salt
    } as users;

    const mockGetUserByUsername = jest.spyOn(userDbModule, 'getUserByUsername');  
    mockGetUserByUsername.mockResolvedValue(userDb);    

    const mockAuthentication = jest.spyOn(utilModule, 'authentication'); 
    mockAuthentication.mockReturnValue(expectInfo.passwd);     

    const mockGenerateAccessTok = jest.spyOn(utilModule, 'generateAccessTok'); 
    mockGenerateAccessTok.mockReturnValue(expectInfo.jwt);         

    const resLogin = await login(req, res);

    expect(mockGetUserByUsername).toHaveBeenCalledTimes(1);    
    expect(mockGetUserByUsername).toHaveBeenCalledWith(expectInfo.username);
    expect(mockAuthentication).toHaveBeenCalledTimes(1);    
    expect(mockAuthentication).toHaveBeenCalledWith(expectInfo.salt, expectInfo.passwd);
    expect(mockGenerateAccessTok).toHaveBeenCalledTimes(1);    
    expect(mockGenerateAccessTok).toHaveBeenCalledWith(expectInfo.username, expectInfo.id);        
    expect(resLogin.status).toHaveBeenCalledWith(200);
    expect(resLogin.json).toHaveBeenCalledWith({
        id: expectInfo.id,
        jwtTok: expectInfo.jwt
    });
  })
})