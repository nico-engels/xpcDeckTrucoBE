import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { afterEach, describe, expect, jest, test } from '@jest/globals';


import { login } from '../../src/controller/authentication';
import { users } from '../../src/entity/users';
import * as userDbModule from '../../src/entity/users-db';
import * as utilModule from '../../src/util';

const mockGetUserByUsername = jest.spyOn(userDbModule, 'getUserByUsername');
const mockGetUserByEmail = jest.spyOn(userDbModule, 'getUserByEmail');
const mockAuthentication = jest.spyOn(utilModule, 'authentication'); 
const mockGenerateAccessTok = jest.spyOn(utilModule, 'generateAccessTok');

afterEach(() => {
  jest.clearAllMocks();  
})

describe('login', () => {
  test('Should login sucessfully with username', async () => {

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

      
    mockGetUserByUsername.mockResolvedValue(userDb);        
    mockAuthentication.mockReturnValue(expectInfo.passwd);          
    mockGenerateAccessTok.mockReturnValue(expectInfo.jwt);         

    const resLogin = await login(req, res);

    expect(mockGetUserByUsername).toHaveBeenCalledTimes(1);    
    expect(mockGetUserByUsername).toHaveBeenCalledWith(expectInfo.username);
    expect(mockAuthentication).toHaveBeenCalledTimes(1);    
    expect(mockAuthentication).toHaveBeenCalledWith(expectInfo.salt, expectInfo.passwd);
    expect(mockGenerateAccessTok).toHaveBeenCalledTimes(1);    
    expect(mockGenerateAccessTok).toHaveBeenCalledWith(expectInfo.username, expectInfo.id);        
    expect(resLogin.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(resLogin.json).toHaveBeenCalledWith({
        id: expectInfo.id,
        jwtTok: expectInfo.jwt
    });
  })

  test('Should login sucessfully with e-mail', async () => {

    const expectInfo = {
      id: 775,
      username: 'testUser',
      email: 'testUser@provider.io',
      passwd: 'masterSec123',
      salt: 'salty21',
      jwt: 'jwtTok&8'
    }

    const req = {
      body: {
        email: expectInfo.email,
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
      
    mockGetUserByEmail.mockResolvedValue(userDb);        
    mockAuthentication.mockReturnValue(expectInfo.passwd);          
    mockGenerateAccessTok.mockReturnValue(expectInfo.jwt);         

    const resLogin = await login(req, res);

    expect(mockGetUserByEmail).toHaveBeenCalledTimes(1);    
    expect(mockGetUserByEmail).toHaveBeenCalledWith(expectInfo.email);
    expect(mockAuthentication).toHaveBeenCalledTimes(1);    
    expect(mockAuthentication).toHaveBeenCalledWith(expectInfo.salt, expectInfo.passwd);
    expect(mockGenerateAccessTok).toHaveBeenCalledTimes(1);    
    expect(mockGenerateAccessTok).toHaveBeenCalledWith(expectInfo.username, expectInfo.id);        
    expect(resLogin.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(resLogin.json).toHaveBeenCalledWith({
        id: expectInfo.id,
        jwtTok: expectInfo.jwt
    });
  })

  test('Should not login without POST parameters', async () => {

    const req = {
    } as Request;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const resLogin = await login(req, res);
    
    expect(resLogin.status).toHaveBeenCalledWith(StatusCodes.CONFLICT);
  })

  test('Should not login with e-mail and username must be one or another', async () => {

    const expectInfo = {
      username: 'testUser',
      email: 'testUseree@provider.io',
    }
    const req = {
      body: {
        username: expectInfo.username,
        email: expectInfo.email,
      }
    } as Request;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const resLogin = await login(req, res);
    
    expect(resLogin.status).toHaveBeenCalledWith(StatusCodes.CONFLICT);
  })

  test('Should not login with wrong password', async () => {

    const expectInfo = {
      username: 'testUser',
      correctPasswd: 'masterSec123',
      wrongPasswd: 'masterSec1234',
      id: 7755,
      salt: 'ssalty21'
    }
    const req = {
      body: {
        username: expectInfo.username,
      }
    } as Request;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;
    const userDb = {
      username: expectInfo.username,
      id: expectInfo.id,
      passwd: expectInfo.correctPasswd,
      salt: expectInfo.salt
    } as users;  

    mockGetUserByEmail.mockResolvedValue(userDb);        
    mockAuthentication.mockReturnValue(expectInfo.wrongPasswd);  

    const resLogin = await login(req, res);
    
    expect(resLogin.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
  })

  test('Should not login with innexistent user', async () => {

    const expectInfo = {
      innexistentUsername: 'testUser222',
    }
    const req = {
      body: {
        username: expectInfo.innexistentUsername,
      }
    } as Request;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    mockGetUserByUsername.mockResolvedValue(null);          

    const resLogin = await login(req, res);
    
    expect(resLogin.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
  })

  test('Should not login xrp-address (NOT_IMPLEMENTED)', async () => {

    const expectInfo = {
      rpAddress: 'r11223456123',
    }
    const req = {
      body: {
        rpAddress: expectInfo.rpAddress,
      }
    } as Request;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;   

    const resLogin = await login(req, res);
    
    expect(resLogin.status).toHaveBeenCalledWith(StatusCodes.NOT_IMPLEMENTED);
  })


})