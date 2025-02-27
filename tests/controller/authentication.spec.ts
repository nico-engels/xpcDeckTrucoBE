import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { afterEach, describe, expect, jest, test } from '@jest/globals';

import { changePassword, generatePreGameToken, login, newPreAuthGame, register } from '../../src/controller/authentication';
import { users } from '../../src/entity/users';
import * as gamesDbModule from '../../src/entity/games-db';
import * as usersDbModule from '../../src/entity/users-db';
import * as roundModule from '../../src/controller/round';
import * as utilModule from '../../src/util';
import { jwtRequest } from '../../src/router/middlewares';

const mockCreateUser = jest.spyOn(usersDbModule, 'createUser');
const mockCreatePreAuthGame = jest.spyOn(usersDbModule, 'createPreAuthGame');
const mockGetPreGameByLink = jest.spyOn(usersDbModule, 'getPreGameByLink');
const mockGetUserByUsername = jest.spyOn(usersDbModule, 'getUserByUsername');
const mockGetUserByEmail = jest.spyOn(usersDbModule, 'getUserByEmail');
const mockGetUserByRpAddress = jest.spyOn(usersDbModule, 'getUserByRpAddress');
const mockUpdatePreAuthGame = jest.spyOn(usersDbModule, 'updatePreAuthGame');
const mockUpdateUser = jest.spyOn(usersDbModule, 'updateUser');
const mockCreateGame = jest.spyOn(gamesDbModule, 'createGame');

const mockNewRound = jest.spyOn(roundModule, 'newRound');

const mockAuthentication = jest.spyOn(utilModule, 'authentication');
const mockGenerateAccessTok = jest.spyOn(utilModule, 'generateAccessTok');
const mockSaltRandom = jest.spyOn(utilModule, 'saltRandom');

afterEach(() => {
  jest.clearAllMocks();
});

describe('login', () => {
  test('Should login sucessfully with username', async () => {
    const expectInfo = {
      id: 775,
      username: 'testUser',
      passwd: 'masterSec123',
      salt: 'salty21',
      jwt: 'jwtTok&8',
    };

    const req = {
      body: {
        username: expectInfo.username,
        password: expectInfo.passwd,
      },
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
      salt: expectInfo.salt,
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
      jwtTok: expectInfo.jwt,
    });
  });

  test('Should login sucessfully with e-mail', async () => {
    const expectInfo = {
      id: 775,
      username: 'testUser',
      email: 'testUser@provider.io',
      passwd: 'masterSec123',
      salt: 'salty21',
      jwt: 'jwtTok&8',
    };

    const req = {
      body: {
        email: expectInfo.email,
        password: expectInfo.passwd,
      },
    } as unknown as Request;
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
      salt: expectInfo.salt,
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
      jwtTok: expectInfo.jwt,
    });
  });

  test('Should not login without POST parameters', async () => {
    const req = {} as Request;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const resLogin = await login(req, res);

    expect(resLogin.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
  });

  test('Should not login with e-mail and username must be one or another', async () => {
    const expectInfo = {
      username: 'testUser',
      email: 'testUseree@provider.io',
    };
    const req = {
      body: {
        username: expectInfo.username,
        email: expectInfo.email,
      },
    } as Request;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const resLogin = await login(req, res);

    expect(resLogin.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
  });

  test('Should not login with wrong password', async () => {
    const expectInfo = {
      username: 'testUser',
      correctPasswd: 'masterSec123',
      wrongPasswd: 'masterSec1234',
      id: 7755,
      salt: 'ssalty21',
    };
    const req = {
      body: {
        username: expectInfo.username,
      },
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
      salt: expectInfo.salt,
    } as users;

    mockGetUserByEmail.mockResolvedValue(userDb);
    mockAuthentication.mockReturnValue(expectInfo.wrongPasswd);

    const resLogin = await login(req, res);

    expect(resLogin.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
  });

  test('Should not login with innexistent user', async () => {
    const expectInfo = {
      innexistentUsername: 'testUser222',
    };
    const req = {
      body: {
        username: expectInfo.innexistentUsername,
      },
    } as Request;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    mockGetUserByUsername.mockResolvedValue(null);

    const resLogin = await login(req, res);

    expect(resLogin.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
  });

  test('Should not login xrp-address (NOT_IMPLEMENTED)', async () => {
    const expectInfo = {
      rpAddress: 'r11223456123',
    };
    const req = {
      body: {
        rpAddress: expectInfo.rpAddress,
      },
    } as Request;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const resLogin = await login(req, res);

    expect(resLogin.status).toHaveBeenCalledWith(StatusCodes.NOT_IMPLEMENTED);
  });
});

describe('register', () => {
  test('Should create user sucessfully', async () => {
    const expectInfo = {
      id: 554,
      username: 'testt3',
      email: 'tttt@tes.io',
      passwd: '12345tty',
      jwt: 'jwtTok333',
      salt: 'salty212',
      usernameCreator: 'xpcUsrCreator',
    };
    const req = {
      body: {
        username: expectInfo.username,
        email: expectInfo.email,
        password: expectInfo.passwd,
      },
      jwtToken: {
        username: expectInfo.usernameCreator,
      },
    } as jwtRequest;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    mockGetUserByUsername.mockResolvedValue(null);
    mockGetUserByEmail.mockResolvedValue(null);
    mockSaltRandom.mockReturnValue(expectInfo.salt);
    mockAuthentication.mockReturnValue(expectInfo.passwd);
    mockCreateUser.mockResolvedValue({
      id: expectInfo.id,
      username: expectInfo.username,
    });
    mockGenerateAccessTok.mockReturnValue(expectInfo.jwt);

    const resRegister = await register(req, res);

    expect(mockGetUserByUsername).toHaveBeenCalledTimes(1);
    expect(mockGetUserByUsername).toHaveBeenCalledWith(expectInfo.username);
    expect(mockGetUserByEmail).toHaveBeenCalledTimes(1);
    expect(mockGetUserByEmail).toHaveBeenCalledWith(expectInfo.email);
    expect(mockSaltRandom).toHaveBeenCalledTimes(1);
    expect(mockAuthentication).toHaveBeenCalledTimes(1);
    expect(mockAuthentication).toHaveBeenCalledWith(expectInfo.salt, expectInfo.passwd);
    expect(mockCreateUser).toHaveBeenCalledTimes(1);
    expect(mockCreateUser).toHaveBeenCalledWith({
      username: expectInfo.username,
      email: expectInfo.email,
      passwd: expectInfo.passwd,
      salt: expectInfo.salt,
    });
    expect(mockGenerateAccessTok).toHaveBeenCalledTimes(1);
    expect(mockGenerateAccessTok).toHaveBeenCalledWith(expectInfo.username, expectInfo.id);
    expect(resRegister.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(resRegister.json).toHaveBeenCalledWith({
      id: expectInfo.id,
      jwtTok: expectInfo.jwt,
      message: 'ok',
    });
  });

  test('Should create user by e-mail sucessfully', async () => {
    const expectInfo = {
      id: 5541,
      username: 'tttta',
      email: 'tttta@tes.io',
      passwd: '1asaa45tty',
      jwt: 'jwtsToks333',
      salt: 'sal33ty212',
      usernameCreator: 'xpcUsrCreator',
    };
    const req = {
      body: {
        email: expectInfo.email,
        password: expectInfo.passwd,
      },
      jwtToken: {
        username: expectInfo.usernameCreator,
      },
    } as jwtRequest;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    mockGetUserByUsername.mockResolvedValue(null);
    mockGetUserByEmail.mockResolvedValue(null);
    mockSaltRandom.mockReturnValue(expectInfo.salt);
    mockAuthentication.mockReturnValue(expectInfo.passwd);
    mockCreateUser.mockResolvedValue({
      id: expectInfo.id,
      username: expectInfo.username,
    });
    mockGenerateAccessTok.mockReturnValue(expectInfo.jwt);

    const resRegister = await register(req, res);

    expect(mockGetUserByUsername).toHaveBeenCalledTimes(1);
    expect(mockGetUserByUsername).toHaveBeenCalledWith(expectInfo.username);
    expect(mockGetUserByEmail).toHaveBeenCalledTimes(1);
    expect(mockGetUserByEmail).toHaveBeenCalledWith(expectInfo.email);
    expect(mockSaltRandom).toHaveBeenCalledTimes(1);
    expect(mockAuthentication).toHaveBeenCalledTimes(1);
    expect(mockAuthentication).toHaveBeenCalledWith(expectInfo.salt, expectInfo.passwd);
    expect(mockCreateUser).toHaveBeenCalledTimes(1);
    expect(mockCreateUser).toHaveBeenCalledWith({
      username: expectInfo.username,
      email: expectInfo.email,
      passwd: expectInfo.passwd,
      salt: expectInfo.salt,
    });
    expect(mockGenerateAccessTok).toHaveBeenCalledTimes(1);
    expect(mockGenerateAccessTok).toHaveBeenCalledWith(expectInfo.username, expectInfo.id);
    expect(resRegister.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(resRegister.json).toHaveBeenCalledWith({
      id: expectInfo.id,
      jwtTok: expectInfo.jwt,
      message: 'ok',
    });
  });

  test('Should create user by xrp address sucessfully', async () => {
    const expectInfo = {
      id: 5,
      username: 'r233344dsdaccc',
      rpAddress: 'r233344dsdaccc',
      passwd: 'ahsg99986ggg',
      jwt: 'jwtsToks333wsaaa',
      salt: 'Sal33ty212',
      usernameCreator: 'xpcUsrCreator',
    };
    const req = {
      body: {
        rpAddress: expectInfo.rpAddress,
        password: expectInfo.passwd,
      },
      jwtToken: {
        username: expectInfo.usernameCreator,
      },
    } as jwtRequest;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    mockGetUserByUsername.mockResolvedValue(null);
    mockGetUserByRpAddress.mockResolvedValue(null);
    mockSaltRandom.mockReturnValue(expectInfo.salt);
    mockAuthentication.mockReturnValue(expectInfo.passwd);
    mockCreateUser.mockResolvedValue({
      id: expectInfo.id,
      username: expectInfo.username,
    });
    mockGenerateAccessTok.mockReturnValue(expectInfo.jwt);

    const resRegister = await register(req, res);

    expect(mockGetUserByUsername).toHaveBeenCalledTimes(1);
    expect(mockGetUserByUsername).toHaveBeenCalledWith(expectInfo.username);
    expect(mockGetUserByRpAddress).toHaveBeenCalledTimes(1);
    expect(mockGetUserByRpAddress).toHaveBeenCalledWith(expectInfo.rpAddress);
    expect(mockSaltRandom).toHaveBeenCalledTimes(1);
    expect(mockAuthentication).toHaveBeenCalledTimes(1);
    expect(mockAuthentication).toHaveBeenCalledWith(expectInfo.salt, expectInfo.passwd);
    expect(mockCreateUser).toHaveBeenCalledTimes(1);
    expect(mockCreateUser).toHaveBeenCalledWith({
      username: expectInfo.username,
      rpAddress: expectInfo.rpAddress,
      passwd: expectInfo.passwd,
      salt: expectInfo.salt,
    });
    expect(mockGenerateAccessTok).toHaveBeenCalledTimes(1);
    expect(mockGenerateAccessTok).toHaveBeenCalledWith(expectInfo.username, expectInfo.id);
    expect(resRegister.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(resRegister.json).toHaveBeenCalledWith({
      id: expectInfo.id,
      jwtTok: expectInfo.jwt,
      message: 'ok',
    });
  });

  test('Should not create user without parameters', async () => {
    const req = {} as Request;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const resRegister = await register(req, res);

    expect(resRegister.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
  });

  test('Should not create user without parameters with creator', async () => {
    const req = {
      jwtToken: {
        username: 'xpcUsrCreator',
      },
    } as jwtRequest;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const resRegister = await register(req, res);

    expect(resRegister.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
  });

  test('Should not create user without parameters with wrong creator', async () => {
    const req = {
      jwtToken: {
        username: 'xpcUsrCreatossr',
      },
    } as jwtRequest;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const resRegister = await register(req, res);

    expect(resRegister.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
  });

  test('Should not duplicate user', async () => {
    const expectInfo = {
      id: 510,
      username: 'oi',
      email: 'oi@1234.xyz',
      usernameCreator: 'xpcUsrCreator',
    };
    const req = {
      body: {
        email: expectInfo.email,
      },
      jwtToken: {
        username: expectInfo.usernameCreator,
      },
    } as jwtRequest;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    mockGetUserByUsername.mockResolvedValue({ id: expectInfo.id });

    const resRegister = await register(req, res);

    expect(mockGetUserByUsername).toHaveBeenCalledTimes(1);
    expect(mockGetUserByUsername).toHaveBeenCalledWith(expectInfo.username);
    expect(resRegister.status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
  });

  test('Should not create user with duplicated xrp address', async () => {
    const expectInfo = {
      id: 2,
      rpAddress: 'r233344dsdaccc',
      usernameCreator: 'xpcUsrCreator',
    };
    const req = {
      body: {
        rpAddress: expectInfo.rpAddress,
      },
      jwtToken: {
        username: expectInfo.usernameCreator,
      },
    } as jwtRequest;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    mockGetUserByUsername.mockResolvedValue(null);
    mockGetUserByRpAddress.mockResolvedValue({ id: expectInfo.id });

    const resRegister = await register(req, res);

    expect(mockGetUserByUsername).toHaveBeenCalledTimes(1);
    expect(mockGetUserByUsername).toHaveBeenCalledWith(expectInfo.rpAddress);
    expect(mockGetUserByRpAddress).toHaveBeenCalledTimes(1);
    expect(mockGetUserByRpAddress).toHaveBeenCalledWith(expectInfo.rpAddress);
    expect(resRegister.status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
  });

  test('Should not create user with duplicated e-mail', async () => {
    const expectInfo = {
      id: 2,
      username: 'pele',
      email: 'pele@santos.com.br',
      usernameCreator: 'xpcUsrCreator',
    };
    const req = {
      body: {
        email: expectInfo.email,
      },
      jwtToken: {
        username: expectInfo.usernameCreator,
      },
    } as jwtRequest;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    mockGetUserByUsername.mockResolvedValue(null);
    mockGetUserByEmail.mockResolvedValue({ id: expectInfo.id });

    const resRegister = await register(req, res);

    expect(mockGetUserByUsername).toHaveBeenCalledTimes(1);
    expect(mockGetUserByUsername).toHaveBeenCalledWith(expectInfo.username);
    expect(mockGetUserByEmail).toHaveBeenCalledTimes(1);
    expect(mockGetUserByEmail).toHaveBeenCalledWith(expectInfo.email);
    expect(resRegister.status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
  });

  test('Should not create user without password', async () => {
    const expectInfo = {
      id: 2,
      username: 'pele',
      email: 'pele@santos.com.br',
      usernameCreator: 'xpcUsrCreator',
    };
    const req = {
      body: {
        email: expectInfo.email,
      },
      jwtToken: {
        username: expectInfo.usernameCreator,
      },
    } as jwtRequest;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    mockGetUserByUsername.mockResolvedValue(null);
    mockGetUserByEmail.mockResolvedValue(null);

    const resRegister = await register(req, res);

    expect(mockGetUserByUsername).toHaveBeenCalledTimes(1);
    expect(mockGetUserByUsername).toHaveBeenCalledWith(expectInfo.username);
    expect(mockGetUserByEmail).toHaveBeenCalledTimes(1);
    expect(mockGetUserByEmail).toHaveBeenCalledWith(expectInfo.email);
    expect(resRegister.status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
  });
});

describe('change password', () => {
  test('Should change password sucessfully', async () => {
    const expectInfo = {
      id: 2,
      username: 'pele',
      oldPasswd: 'peixe123',
      newPasswd: 'neymar123BiMundial',
      salt: '123dry',
    };

    const req = {
      body: {
        oldPassword: expectInfo.oldPasswd,
        newPassword: expectInfo.newPasswd,
      },
      jwtToken: {
        username: expectInfo.username,
      },
    } as jwtRequest;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    mockGetUserByUsername.mockResolvedValue({ id: expectInfo.id, passwd: expectInfo.oldPasswd });
    mockAuthentication.mockImplementation((salt: string, password: string) => {
      if (password === expectInfo.oldPasswd) return expectInfo.oldPasswd;
      else return expectInfo.newPasswd;
    });
    mockSaltRandom.mockReturnValue(expectInfo.salt);
    mockUpdateUser.mockResolvedValue({ id: expectInfo.id });

    const resChangePasswd = await changePassword(req, res);

    expect(mockGetUserByUsername).toHaveBeenCalledTimes(1);
    expect(mockGetUserByUsername).toHaveBeenCalledWith(expectInfo.username);
    expect(mockAuthentication).toHaveBeenCalledTimes(2);
    expect(mockUpdateUser).toHaveBeenCalledTimes(1);
    expect(mockUpdateUser).toHaveBeenCalledWith({
      id: expectInfo.id,
      passwd: expectInfo.newPasswd,
      salt: expectInfo.salt,
    });
    expect(resChangePasswd.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(resChangePasswd.json).toHaveBeenCalledWith({
      id: expectInfo.id,
      message: 'ok',
    });
  });

  test('Should not change password if not find the user', async () => {
    const expectInfo = {
      id: 2,
      username: 'pele',
    };

    const req = {
      jwtToken: {
        username: expectInfo.username,
      },
    } as jwtRequest;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    mockGetUserByUsername.mockResolvedValue(null);

    const resChangePasswd = await changePassword(req, res);

    expect(mockGetUserByUsername).toHaveBeenCalledTimes(1);
    expect(mockGetUserByUsername).toHaveBeenCalledWith(expectInfo.username);
    expect(resChangePasswd.status).toHaveBeenCalledWith(StatusCodes.CONFLICT);
  });

  test('Should not change password if provided the parameters', async () => {
    const expectInfo = {
      id: 22,
      username: 'pele',
    };

    const req = {
      jwtToken: {
        username: expectInfo.username,
      },
    } as jwtRequest;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    mockGetUserByUsername.mockResolvedValue({ id: expectInfo.id });

    const resChangePasswd = await changePassword(req, res);

    expect(mockGetUserByUsername).toHaveBeenCalledTimes(1);
    expect(mockGetUserByUsername).toHaveBeenCalledWith(expectInfo.username);
    expect(resChangePasswd.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
  });

  test('Should not change password if new password is not valid', async () => {
    const expectInfo = {
      id: 12,
      username: 'neymar',
      oldPasswd: 'peixe123',
      newPasswd: '1223',
      salt: '123dry',
    };

    const req = {
      body: {
        oldPassword: expectInfo.oldPasswd,
        newPassword: expectInfo.newPasswd,
      },
      jwtToken: {
        username: expectInfo.username,
      },
    } as jwtRequest;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    mockGetUserByUsername.mockResolvedValue({ id: expectInfo.id, passwd: expectInfo.oldPasswd, salt: expectInfo.salt });
    mockAuthentication.mockReturnValue(expectInfo.oldPasswd);
    mockSaltRandom.mockReturnValue(expectInfo.salt);

    const resChangePasswd = await changePassword(req, res);

    expect(mockGetUserByUsername).toHaveBeenCalledTimes(1);
    expect(mockGetUserByUsername).toHaveBeenCalledWith(expectInfo.username);
    expect(mockAuthentication).toHaveBeenCalledTimes(1);
    expect(mockAuthentication).toHaveBeenCalledWith(expectInfo.salt, expectInfo.oldPasswd);
    expect(resChangePasswd.status).toHaveBeenCalledWith(StatusCodes.CONFLICT);
  });
});

describe('Create pre-auth game', () => {
  test('Should create pre-auth game successfully', async () => {
    const expectInfo = {
      player1: {
        username: 'pyr1',
        id: 22,
      },
      player2: {
        username: 'ply2',
        id: 25,
      },
      jwtUsername: 'xt-admin',
    };
    const expectNewGameDb = {
      id: 24,
      player1: expectInfo.player1,
      player2: expectInfo.player2,
    };
    const expectNewPreGameDb = {
      id: 11,
      player1Link: 'jkjksjdm',
      player2Link: 'jkDDfjdm',
    };

    const req = {
      body: {
        player1username: expectInfo.player1.username,
        player2username: expectInfo.player2.username,
      },
      jwtToken: {
        username: expectInfo.jwtUsername,
      },
    } as jwtRequest;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    mockGetUserByUsername.mockImplementation((username: string) => {
      if (username === expectInfo.player1.username) return Promise.resolve(expectInfo.player1);
      else return Promise.resolve(expectInfo.player2);
    });
    mockCreateGame.mockResolvedValue(expectNewGameDb);
    mockNewRound.mockResolvedValue({});
    mockCreatePreAuthGame.mockResolvedValue(expectNewPreGameDb);

    const resNewAuthGame = await newPreAuthGame(req, res);

    expect(mockGetUserByUsername).toHaveBeenCalledTimes(2);
    expect(mockCreateGame).toHaveBeenCalledTimes(1);
    expect(mockCreateGame).toHaveBeenCalledWith({
      player1: expectInfo.player1,
      player2: expectInfo.player2,
      player1Score: 0,
      player2Score: 0,
    });
    expect(mockNewRound).toHaveBeenCalledTimes(1);
    expect(mockNewRound).toHaveBeenCalledWith(expectNewGameDb, 1);
    expect(mockCreatePreAuthGame).toHaveBeenCalledTimes(1);
    expect(mockCreatePreAuthGame).toHaveBeenCalledWith({ game: expectNewGameDb });
    expect(resNewAuthGame.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(resNewAuthGame.json).toHaveBeenCalledWith({
      message: 'ok',
      id: expectNewPreGameDb.id,
      player1Link: expectNewPreGameDb.player1Link,
      player2Link: expectNewPreGameDb.player2Link,
    });
  });

  test('Only xt-admin should create a new pre-auth game', async () => {
    const expectInfo = {
      jwtUsername: 'super-admin',
    };

    const req = {
      jwtToken: {
        username: expectInfo.jwtUsername,
      },
    } as jwtRequest;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const resNewAuthGame = await newPreAuthGame(req, res);

    expect(resNewAuthGame.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
  });

  test('Should not create without parameters', async () => {
    const expectInfo = {
      jwtUsername: 'xt-admin',
    };

    const req = {
      jwtToken: {
        username: expectInfo.jwtUsername,
      },
    } as jwtRequest;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const resNewAuthGame = await newPreAuthGame(req, res);

    expect(resNewAuthGame.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
  });

  test('Should not create a game against himself', async () => {
    const expectInfo = {
      player1: {
        id: 15,
        username: 'blast',
      },
      player2: {
        id: 15,
        username: 'blast',
      },
      jwtUsername: 'xt-admin',
    };

    const req = {
      body: {
        player1username: expectInfo.player1.username,
        player2username: expectInfo.player2.username,
      },
      jwtToken: {
        username: expectInfo.jwtUsername,
      },
    } as jwtRequest;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const resNewAuthGame = await newPreAuthGame(req, res);

    expect(resNewAuthGame.status).toHaveBeenCalledWith(StatusCodes.CONFLICT);
  });
});

describe('Login with the pre-auth link', () => {
  test('Should generate the jwt token by the link ply1', async () => {
    const expectInfo = {
      player1Link: 'jksdj34312sd',
      deviceId: 'device-123',
      player2Link: 'petecaGy777',
      player: {
        id: 33,
        username: 'playerk1',
      },
      jwtTok: 'xXxjwtTok&8',
      gameId: 889,
    };
    const req = {
      body: {
        playerLink: expectInfo.player1Link,
        deviceId: expectInfo.deviceId,
      },
    } as Request;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    mockGetPreGameByLink.mockResolvedValue({
      player1Link: expectInfo.player1Link,
      player2Link: expectInfo.player2Link,
      game: {
        id: expectInfo.gameId,
        player1: {
          id: expectInfo.player.id,
          username: expectInfo.player.username,
        },
      },
    });
    mockGenerateAccessTok.mockReturnValue(expectInfo.jwtTok);
    mockUpdatePreAuthGame.mockResolvedValue({});

    const resPreTok = await generatePreGameToken(req, res);

    expect(mockGetPreGameByLink).toBeCalledTimes(1);
    expect(mockGetPreGameByLink).toBeCalledWith(expectInfo.player1Link);
    expect(mockGenerateAccessTok).toBeCalledTimes(1);
    expect(mockGenerateAccessTok).toBeCalledWith(expectInfo.player.username, expectInfo.player.id, expectInfo.gameId);
    expect(mockUpdatePreAuthGame).toBeCalledTimes(1);
    expect(mockUpdatePreAuthGame).toBeCalledWith({
      game: {
        id: expectInfo.gameId,
        player1: {
          id: expectInfo.player.id,
          username: expectInfo.player.username,
        },
      },
      player1Link: expectInfo.player1Link,
      player2Link: expectInfo.player2Link,
      player1DeviceId: expectInfo.deviceId,
    });
    expect(resPreTok.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(resPreTok.json).toHaveBeenCalledWith({
      playerId: expectInfo.player.id,
      player: expectInfo.player.username,
      jwtTok: expectInfo.jwtTok,
      gameId: expectInfo.gameId,
    });
  });

  test('Should generate the jwt token by the link ply2', async () => {
    const expectInfo = {
      player1Link: 'jksdj34312sd',
      deviceId: 'device-123',
      player2Link: 'petecaGy777',
      player: {
        id: 33,
        username: 'playerk1',
      },
      jwtTok: 'xXxjwtTok&8',
      gameId: 889,
    };
    const req = {
      body: {
        playerLink: expectInfo.player2Link,
        deviceId: expectInfo.deviceId,
      },
    } as Request;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    mockGetPreGameByLink.mockResolvedValue({
      player1Link: expectInfo.player1Link,
      player2Link: expectInfo.player2Link,
      game: {
        id: expectInfo.gameId,
        player2: {
          id: expectInfo.player.id,
          username: expectInfo.player.username,
        },
      },
    });
    mockGenerateAccessTok.mockReturnValue(expectInfo.jwtTok);
    mockUpdatePreAuthGame.mockResolvedValue({});

    const resPreTok = await generatePreGameToken(req, res);

    expect(mockGetPreGameByLink).toBeCalledTimes(1);
    expect(mockGetPreGameByLink).toBeCalledWith(expectInfo.player2Link);
    expect(mockGenerateAccessTok).toBeCalledTimes(1);
    expect(mockGenerateAccessTok).toBeCalledWith(expectInfo.player.username, expectInfo.player.id, expectInfo.gameId);
    expect(mockUpdatePreAuthGame).toBeCalledTimes(1);
    expect(mockUpdatePreAuthGame).toBeCalledWith({
      game: {
        id: expectInfo.gameId,
        player2: {
          id: expectInfo.player.id,
          username: expectInfo.player.username,
        },
      },
      player1Link: expectInfo.player1Link,
      player2Link: expectInfo.player2Link,
      player2DeviceId: expectInfo.deviceId,
    });
    expect(resPreTok.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(resPreTok.json).toHaveBeenCalledWith({
      playerId: expectInfo.player.id,
      player: expectInfo.player.username,
      jwtTok: expectInfo.jwtTok,
      gameId: expectInfo.gameId,
    });
  });

  test('Should not generate without parameters', async () => {
    const req = {} as Request;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const resPreTok = await generatePreGameToken(req, res);

    expect(resPreTok.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
  });

  test('Should not generate with invalid link', async () => {
    const expectInfo = {
      player1Link: 'jksdj34312sd',
      deviceId: 'device-123',
    };
    const req = {
      body: {
        playerLink: expectInfo.player1Link,
        deviceId: expectInfo.deviceId,
      },
    } as Request;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    mockGetPreGameByLink.mockResolvedValue(null);

    const resPreTok = await generatePreGameToken(req, res);

    expect(mockGetPreGameByLink).toBeCalledTimes(1);
    expect(mockGetPreGameByLink).toBeCalledWith(expectInfo.player1Link);
    expect(resPreTok.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
  });

  test('Should not generate with invalid deviceId', async () => {
    const expectInfo = {
      player1Link: 'jksdj34312sd',
      player2Link: 'asdsjksdj34312sd',
      deviceIdPlayer2: 'sice-123',
      deviceIdPlayer2Correct: 'slice-123',
      player1: {
        id: 387,
        username: 'playeaark1',
      },
      player2: {
        id: 31187,
        username: 'playk2',
      }
    };
    const req = {
      body: {
        playerLink: expectInfo.player2Link,
        deviceId: expectInfo.deviceIdPlayer2,
      },
    } as Request;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    mockGetPreGameByLink.mockResolvedValue({
      player1Link: expectInfo.player1Link,
      player2Link: expectInfo.player2Link,
      player2DeviceId: expectInfo.deviceIdPlayer2Correct,
      game: {
        player1: expectInfo.player1,
        player2: expectInfo.player2,
      },
    });

    const resPreTok = await generatePreGameToken(req, res);

    expect(mockGetPreGameByLink).toBeCalledTimes(1);
    expect(mockGetPreGameByLink).toBeCalledWith(expectInfo.player2Link);
    expect(resPreTok.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
  });
});
