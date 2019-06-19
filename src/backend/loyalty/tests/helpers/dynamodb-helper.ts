import DynamoDB, { DocumentClient } from 'aws-sdk/clients/dynamodb';

export async function dbSetup(accessKeyId: string, secretAccessKey: string, sessionToken: string): Promise<DynamoDB> {
  return new DynamoDB({
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
    sessionToken: sessionToken
  })
}

export async function createTable(tableName: string, dynamoDb: DynamoDB): Promise<Object> {
  const params = {
    AttributeDefinitions: [{
      AttributeName: 'customerId',
      AttributeType: 'S'
    },
    {
      AttributeName: 'flag',
      AttributeType: 'S'
    },
    {
      AttributeName: 'id',
      AttributeType: 'S'
    }],
    KeySchema: [{
      AttributeName: "id",
      KeyType: "HASH"
    }],
    GlobalSecondaryIndexes: [{
      IndexName: 'customer-flag',
      KeySchema: [{
        AttributeName: 'customerId',
        KeyType: 'HASH'
      },
      {
        AttributeName: 'flag',
        KeyType: 'RANGE'
      }],
      Projection: {
        ProjectionType: 'ALL'
      }
    }],
    BillingMode: 'PAY_PER_REQUEST',
    TableName: tableName
  };
  await dynamoDb.createTable(params).promise();

  return dynamoDb.waitFor('tableExists', {
    TableName: tableName
  }).promise();
}

export async function deleteTable(tableName: string, dynamoDb: DynamoDB): Promise<Object> {
  // Destroy a table at the end of our tests
  await dynamoDb.deleteTable({
    TableName: tableName
  }).promise()

  return dynamoDb.waitFor('tableNotExists', {
    TableName: tableName
  }).promise()
}