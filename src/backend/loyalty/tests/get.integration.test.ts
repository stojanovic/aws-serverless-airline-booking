import { points } from '../src/get';
import DynamoDB, { DocumentClient } from 'aws-sdk/clients/dynamodb';
import uuidv4 from 'uuid/v4';
import { getCredentials } from './helpers/credentials-helper';
import { dbSetup, createTable, deleteTable, insertData } from './helpers/dynamodb-helper';

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

  test('No data read from Loyalty Table', async () => {
    const customerId = uuidv4();
    try {
      await points(customerId, documentClient, tableName)
    } catch(err) {
      expect(err).toContain('No data')
    }
  });

  test('No data read from Loyalty Table', async () => {
    const customerId = uuidv4();
    const data = {
      id: uuidv4(),
      customerId: customerId,
      points: 100,
      flag: 'active',
      date: new Date().toISOString()
    }
    await insertData(tableName, data, documentClient)
    
    const numberOfPoints = await points(customerId, documentClient, tableName)
    expect(numberOfPoints).toBe(100)
  });
});
