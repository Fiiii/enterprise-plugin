import { getSecret, getAccessKeyForTenant } from '@serverless/platform-sdk'
import { getSecretFromEnterprise, hookIntoVariableGetter } from './variables'

jest.mock('@serverless/platform-sdk', () => ({
  getSecret: jest.fn().mockReturnValue(Promise.resolve({ secretValue: 'SECRET!' })),
  getAccessKeyForTenant: jest.fn().mockReturnValue(Promise.resolve('accessKey'))
}))

afterAll(() => jest.restoreAllMocks())

describe('variables - getSecretFromEnterprise', () => {
  it('gets the access key and grabs the secret from backend', async () => {
    await getSecretFromEnterprise({
      secretName: 'name',
      app: 'app',
      service: 'service',
      tenant: 'tenant'
    })
    expect(getAccessKeyForTenant).toBeCalledWith('tenant')
    expect(getSecret).toBeCalledWith({
      secretName: 'name',
      accessKey: 'accessKey',
      app: 'app',
      service: 'service',
      tenant: 'tenant'
    })
  })
})

describe('variables - hookIntoVariableGetter', () => {
  const getValueFromSource = jest.fn().mockReturnValue('frameworkVariableValue')
  const serverless = {
    service: {
      app: 'app',
      service: 'service',
      tenant: 'tenant'
    },
    variables: { getValueFromSource }
  }
  const state = { secretsUsed: new Set() }

  afterAll(() => {
    getValueFromSource.resetMock()
  })

  it('overrides the default variable getter', async () => {
    const restore = hookIntoVariableGetter({ serverless, state })
    expect(serverless.variables.getValueFromSource).not.toEqual(getValueFromSource)
    serverless.variables.getValueFromSource('name')
    expect(getAccessKeyForTenant).toBeCalledWith('tenant')
    expect(getSecret).toBeCalledWith({
      secretName: 'name',
      accessKey: 'accessKey',
      app: 'app',
      service: 'service',
      tenant: 'tenant'
    })
    expect(state.secretsUsed).toEqual(new Set(['name']))
    restore()
    expect(serverless.variables.getValueFromSource).toEqual(getValueFromSource)
  })
})
