import { addPoints } from '../src/ingest';
import DynamoDB, { DocumentClient } from 'aws-sdk/clients/dynamodb';
import uuidv4 from 'uuid/v4';
import { getCredentials } from './helpers/credentials-helper';
import { dbSetup, createTable, deleteTable } from './helpers/dynamodb-helper';

let dynamoDb: DynamoDB;
let documentClient: DocumentClient;
// Table name for test DynamoDB
const tableName = `airline-test-table-${uuidv4()}`;

describe('Loyalty Ingest Function integration tests', () => {
  beforeAll(async () => {
    if (process.env.LOYALTY_INTEG_ROLE !== undefined) {
      // Assume role
      const role = await getCredentials(process.env.LOYALTY_INTEG_ROLE, process.env.LOYALTY_INTEG_EXTERNAL_ID)
      
      // Initialize DynamoDB instance with assumed role
      dynamoDb = await dbSetup(role.Credentials!.AccessKeyId, role.Credentials!.SecretAccessKey, role.Credentials!.SessionToken)
      
      // Initialize document client
      documentClient = new DocumentClient({
        accessKeyId: role.Credentials!.AccessKeyId,
        secretAccessKey: role.Credentials!.SecretAccessKey,
        sessionToken: role.Credentials!.SessionToken
      })
      
      // Create DynamoDB table
      return await createTable(tableName, dynamoDb);
    }
  }, 60000) // Increase timeout to 60s

  afterAll(async () => {
    return await deleteTable(tableName, dynamoDb);
  }, 60000) // Increase timeout to 60s

  test('Successfully write to loyalty table', async () => {
    const customerId = uuidv4();
    await addPoints(customerId, 1235, documentClient, tableName);

    const params = {
      TableName: tableName,
      IndexName: "customer-flag",
      KeyConditionExpression: 'customerId = :hkey and flag = :rkey',
      ExpressionAttributeValues: {
        ':hkey': customerId,
        ':rkey': 'active'
      }
    };

    const result = await documentClient.query(params).promise();

    expect(Array.isArray(result.Items)).toBeTruthy();
    expect(result.Items!.length).toBe(1);
    expect(result.Items![0].customerId).toBe(customerId);
  });

  test('Successfully write multiple entries for the same customer id', async () => {
    const customerId = uuidv4();
    await addPoints(customerId, 100, documentClient, tableName);
    await addPoints(customerId, 200, documentClient, tableName);

    const params = {
      TableName: tableName,
      IndexName: "customer-flag",
      KeyConditionExpression: 'customerId = :hkey and flag = :rkey',
      ExpressionAttributeValues: {
        ':hkey': customerId,
        ':rkey': 'active'
      }
    };

    const result = await documentClient.query(params).promise();

    expect(Array.isArray(result.Items)).toBeTruthy();
    expect(result.Items!.length).toBe(2);
    expect(result.Items![0].points + result.Items![1].points).toBe(300);
  });
});
