import fs from 'fs-extra'
import wrap from './wrap'
import { addTree, writeZip } from './zipTree'
import JSZip from 'jszip'

afterEach(() => jest.clearAllMocks())
jest.mock('jszip', () => ({
  loadAsync: jest.fn().mockReturnValue(
    Promise.resolve({
      file: jest.fn()
    })
  )
}))
jest.mock('./zipTree', () => ({
  addTree: jest.fn().mockReturnValue(Promise.resolve()),
  writeZip: jest.fn().mockReturnValue(Promise.resolve())
}))
jest.mock('fs-extra', () => ({
  writeFileSync: jest.fn(),
  pathExistsSync: jest.fn().mockReturnValue(true),
  removeSync: jest.fn(),
  ensureDirSync: jest.fn(),
  copySync: jest.fn(),
  readFile: jest.fn().mockReturnValue(Promise.resolve('zipcontents'))
}))

describe('wrap - wrap', () => {
  it('wraps copies js sdk & calls wrapper', async () => {
    const log = jest.fn()

    const ctx = {
      state: {},
      provider: { getStage: jest.fn().mockReturnValue('dev') },
      sls: {
        config: { servicePath: 'path' },
        service: {
          service: 'service',
          tenant: 'tenant',
          app: 'app',
          appUid: 'appUid',
          tenantUid: 'tenantUid',
          provider: { stage: 'dev' },
          functions: {
            dunc: {
              runtime: 'python3.6',
              handler: 'handlerFile.handlerFunc'
            },
            func: {
              runtime: 'nodejs8.10',
              handler: 'handlerFile.handlerFunc'
            }
          }
        },
        cli: { log }
      }
    }
    await wrap(ctx)

    expect(fs.pathExistsSync).toBeCalledWith('path/serverless-sdk')
    expect(ctx.state.functions).toEqual({
      func: {
        entryNew: 's-func',
        entryOrig: 'handlerFile',
        handlerNew: 'handler',
        handlerOrig: 'handlerFunc',
        key: 'func',
        name: 'service-dev-func',
        timeout: 6,
        runtime: 'nodejs8.10'
      }
    })
    expect(ctx.sls.service.functions).toEqual({
      dunc: {
        runtime: 'python3.6',
        handler: 'handlerFile.handlerFunc'
      },
      func: {
        runtime: 'nodejs8.10',
        handler: 's-func.handler'
      }
    })
    expect(ctx.sls.service.package).toEqual({ include: ['s-*.js', 'serverless-sdk/**'] })
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1)
    expect(fs.writeFileSync).toBeCalledWith(
      'path/s-func.js',
      `var serverlessSDK = require('./serverless-sdk/index.js')
serverlessSDK = new serverlessSDK({
tenantId: 'tenant',
applicationName: 'app',
appUid: 'appUid',
tenantUid: 'tenantUid',
serviceName: 'service',
stageName: 'dev'})
module.exports.handler = serverlessSDK.handler(require('./handlerFile.js').handlerFunc, { functionName: 'service-dev-func' })`
    )
  })

  it('wraps copies js sdk & calls wrapper when using an artifact', async () => {
    const log = jest.fn()

    const ctx = {
      state: {},
      provider: { getStage: jest.fn().mockReturnValue('dev') },
      sls: {
        config: { servicePath: 'path' },
        service: {
          service: 'service',
          tenant: 'tenant',
          app: 'app',
          appUid: 'appUid',
          tenantUid: 'tenantUid',
          provider: { stage: 'dev' },
          functions: {
            func: {
              runtime: 'nodejs8.10',
              handler: 'handlerFile.handlerFunc',
              package: { artifact: 'bundle.zip' }
            }
          }
        },
        cli: { log }
      }
    }
    await wrap(ctx)

    expect(fs.pathExistsSync).toBeCalledWith('path/serverless-sdk')
    expect(ctx.state.functions).toEqual({
      func: {
        entryNew: 's-func',
        entryOrig: 'handlerFile',
        handlerNew: 'handler',
        handlerOrig: 'handlerFunc',
        key: 'func',
        name: 'service-dev-func',
        timeout: 6,
        runtime: 'nodejs8.10'
      }
    })
    expect(ctx.sls.service.functions).toEqual({
      func: {
        runtime: 'nodejs8.10',
        handler: 's-func.handler',
        package: { artifact: 'bundle.zip' }
      }
    })
    expect(ctx.sls.service.package).toEqual({ include: ['s-*.js', 'serverless-sdk/**'] })
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1)
    expect(fs.writeFileSync).toBeCalledWith(
      'path/s-func.js',
      `var serverlessSDK = require('./serverless-sdk/index.js')
serverlessSDK = new serverlessSDK({
tenantId: 'tenant',
applicationName: 'app',
appUid: 'appUid',
tenantUid: 'tenantUid',
serviceName: 'service',
stageName: 'dev'})
module.exports.handler = serverlessSDK.handler(require('./handlerFile.js').handlerFunc, { functionName: 'service-dev-func' })`
    )
    expect(fs.readFile).toBeCalledWith('bundle.zip')
    expect(JSZip.loadAsync).toBeCalledWith('zipcontents')
    expect(addTree).toBeCalledWith({ file: expect.any(Function) }, 'serverless-sdk')
    expect(writeZip).toBeCalledWith({ file: expect.any(Function) }, 'bundle.zip')
  })

  it('wraps copies js sdk & calls wrapper with package individually', async () => {
    const log = jest.fn()

    const ctx = {
      state: {},
      provider: { getStage: jest.fn().mockReturnValue('dev') },
      sls: {
        config: { servicePath: 'path' },
        service: {
          package: { individually: true },
          service: 'service',
          tenant: 'tenant',
          app: 'app',
          appUid: 'appUid',
          tenantUid: 'tenantUid',
          provider: { stage: 'dev' },
          functions: {
            dunc: {
              runtime: 'python3.6',
              handler: 'handlerFile.handlerFunc'
            },
            func: {
              runtime: 'nodejs8.10',
              handler: 'handlerFile.handlerFunc'
            }
          }
        },
        cli: { log }
      }
    }
    await wrap(ctx)

    expect(fs.pathExistsSync).toBeCalledWith('path/serverless-sdk')
    expect(ctx.state.functions).toEqual({
      func: {
        entryNew: 's-func',
        entryOrig: 'handlerFile',
        handlerNew: 'handler',
        handlerOrig: 'handlerFunc',
        key: 'func',
        name: 'service-dev-func',
        timeout: 6,
        runtime: 'nodejs8.10'
      }
    })
    expect(ctx.sls.service.functions).toEqual({
      dunc: {
        runtime: 'python3.6',
        handler: 'handlerFile.handlerFunc'
      },
      func: {
        runtime: 'nodejs8.10',
        handler: 's-func.handler',
        package: {
          include: ['s-func.js', 'serverless-sdk/**']
        }
      }
    })
    expect(ctx.sls.service.package).toEqual({ individually: true })
    expect(fs.writeFileSync).toHaveBeenCalledTimes(1)
    expect(fs.writeFileSync).toBeCalledWith(
      'path/s-func.js',
      `var serverlessSDK = require('./serverless-sdk/index.js')
serverlessSDK = new serverlessSDK({
tenantId: 'tenant',
applicationName: 'app',
appUid: 'appUid',
tenantUid: 'tenantUid',
serviceName: 'service',
stageName: 'dev'})
module.exports.handler = serverlessSDK.handler(require('./handlerFile.js').handlerFunc, { functionName: 'service-dev-func' })`
    )
  })
})
