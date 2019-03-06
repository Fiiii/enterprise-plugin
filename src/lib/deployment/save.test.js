import parseDeploymentData from './parse'
import saveDeployment from './save'

jest.mock('./parse', () =>
  jest.fn().mockReturnValue(
    Promise.resolve({
      save: jest.fn().mockReturnValue({ dashboardUrl: 'https://dashboard.serverless.com/foo' })
    })
  )
)

describe('saveDeployment', () => {
  let log
  beforeEach(() => {
    log = jest.fn()
  })
  afterEach(() => jest.restoreAllMocks())
  it('calls parse & save', async () => {
    const serverless = { cli: { log } }
    const ctx = { sls: serverless, serverless }
    await saveDeployment(ctx)
    expect(parseDeploymentData).toBeCalledWith(ctx)
    expect((await parseDeploymentData()).save).toHaveBeenCalledTimes(1)
    expect(log).toBeCalledWith(
      `Successfully published your service to the Enterprise Dashboard: https://dashboard.serverless.com/foo`,
      'Serverless Enterprise'
    )
  })
})
