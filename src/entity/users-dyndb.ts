import { GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { dyndoclient } from './data-source-dyndb';
import { users } from './users';

export async function getUserByUsernameDyndb(username: string) {
  const cmd = new GetCommand({
    TableName: 'users',
    Key: {
      username,
    },
  });

  const res = await dyndoclient.send(cmd);

  return res.Item as users;
}

export async function getUserByEmailDyndb(email: string) {
  const cmd = new ScanCommand({
    TableName: 'users',
    FilterExpression: 'email = :email',
    ExpressionAttributeValues: {
      ':email': email,
    },
  });

  const res = await dyndoclient.send(cmd);

  return res.Items[0] as users;
}

export async function createUserDyndb(user: users) {
  if (!user.id) {
    user.id = Math.floor(Math.random() * 1024);
  }

  const cmd = new PutCommand({
    TableName: 'users',
    Item: user,
  });

  await dyndoclient.send(cmd);

  return user;
}
