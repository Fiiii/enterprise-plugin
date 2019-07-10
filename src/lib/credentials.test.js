const getCredentialsLocal = require('./credentials')
const { getCredentials, getAccessKeyForTenant } = require('@serverless/platform-sdk')

jest.mock('@serverless/platform-sdk', () => ({
  getAccessKeyForTenant: jest.fn().mockReturnValue(Promise.resolve('ACCESS_KEY')),
  getCredentials: jest.fn().mockReturnValue({
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    sessionToken: 'sessionToken',
  }),
}))

afterAll(() => jest.restoreAllMocks())

describe('credentials', () => {
  it('calls API func and sets env vars', async () => {
    process.env.SLS_CLOUD_ACCESS = 'true'
    const log = jest.fn()
    const getStage = jest.fn().mockReturnValue('stage')
    const getServiceName = jest.fn().mockReturnValue('service')
    const ctx = {
      sls: {
        processedInput: { commands: ['deploy'] },
        service: {
          app: 'app',
          tenant: 'tenant',
          getServiceName,
        },
        cli: { log },
      },
      provider: { getStage },
    }
    await getCredentialsLocal(ctx)
    expect(getAccessKeyForTenant).toBeCalledWith('tenant')
    expect(getCredentials).toBeCalledWith({
      stageName: 'stage',
      command: 'deploy',
      app: 'app',
      tenant: 'tenant',
      service: 'service',
      accessKey: 'ACCESS_KEY',
    })
    expect(log).toBeCalledWith('Cloud credentials set from Serverless Platform.')
    expect(process.env.AWS_ACCESS_KEY_ID).toEqual('accessKeyId')
    expect(process.env.AWS_SECRET_ACCESS_KEY).toEqual('secretAccessKey')
    expect(process.env.AWS_SESSION_TOKEN).toEqual('sessionToken')
  })
})
