import Sts, { AssumeRoleResponse, AssumeRoleRequest } from 'aws-sdk/clients/sts';

const sts = new Sts();

export async function getCredentials(roleArn: string, externalId: string | undefined): Promise<AssumeRoleResponse> {
  const params:AssumeRoleRequest = {
    RoleArn: roleArn,
    DurationSeconds: 900,
    RoleSessionName: 'AirlineTest'
  };
  if (externalId !== undefined) {
    params.ExternalId = externalId;
  }
  const result = await sts.assumeRole(params).promise()

  return result;
}