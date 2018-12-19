const awsApiGatewayLogsCollection = require('./lib/awsApiGatewayLogsCollection')
const awsLambdaLogsCollection = require('./lib/awsLambdaLogsCollection')
const fetchCredentials = require('./lib/fetchCredentials.js')
const wrap = require('./lib/wrap.js')
const wrapClean = require('./lib/wrapClean.js')
const safeguards = require('./lib/safeguards.js')

/*
 * Serverless Platform Plugin
 */

class ServerlessPlatformPlugin {

  constructor(sls) {

    // Defaults
    this.sls = sls
    this.state = {}
    this.provider = this.sls.getProvider('aws');

    // Check if Platform is configured
    let missing
    if (!this.sls.service.tenant) missing = 'tenant'
    if (!this.sls.service.app) missing = 'app'
    if (!this.sls.service.service) missing = 'service'
    if (missing) {
      this.sls.cli.log(`Warning: The Serverless Platform Plugin requires a "${missing}" property in your "serverless.yml" and will not work without it.`)
    }

    // Set Plugin hooks for all Platform Plugin features here
    this.hooks = {
      'before:package:createDeploymentArtifacts': this.route('before:package:createDeploymentArtifacts').bind(this),
      'after:package:createDeploymentArtifacts': this.route('after:package:createDeploymentArtifacts').bind(this),
      'before:deploy:function:packageFunction': this.route('before:deploy:function:packageFunction').bind(this),
      'before:invoke:local:invoke': this.route('before:invoke:local:invoke').bind(this),
      'before:deploy:deploy': this.route('before:deploy:deploy').bind(this),
      'before:info:info': this.route('before:info:info').bind(this),
      'before:logs:logs': this.route('before:logs:logs').bind(this),
      'before:metrics:metrics': this.route('before:metrics:metrics').bind(this),
      'before:remove:remove': this.route('before:remove:remove').bind(this),
      'after:invoke:local:invoke': this.route('after:invoke:local:invoke').bind(this),
      'before:offline:start:init': this.route('before:offline:start:init').bind(this),
      'before:step-functions-offline:start': this.route('before:step-functions-offline:start').bind(this),
    }
  }

  /*
   * Route
   */

  route(hook) {
    const self = this
    return async () => {
      switch (hook) {
        case 'before:package:createDeploymentArtifacts':
          await wrap(self)
          break
        case 'after:package:createDeploymentArtifacts':
          await wrapClean(self)
          break
        case 'before:deploy:function:packageFunction':
          // await wrap(self)
          break
        case 'before:deploy:deploy':
          await safeguards.runPolicies(self)
          await awsApiGatewayLogsCollection(self)
          await awsLambdaLogsCollection(self)
          await fetchCredentials(self)
          break
        case 'before:info:info':
          await fetchCredentials(self)
          break
        case 'before:logs:logs':
          await fetchCredentials(self)
          break
        case 'before:metrics:metrics':
          await fetchCredentials(self)
          break
        case 'before:remove:remove':
          await fetchCredentials(self)
          break
        case 'before:invoke:local:invoke':
          await wrap(self)
          break
        case 'after:invoke:local:invoke':
          await wrapClean(self)
          break
        case 'before:offline:start:init':
          // await wrap(self)
          break
        case 'before:step-functions-offline:start':
          // await wrap(self)
          break
      }
    }
  }
}

module.exports = ServerlessPlatformPlugin
