/*
 * Save Deployment
 * - This uses the new deployment data model.
 */

import parseDeploymentData from './parse'

export default async function(ctx) {
  ctx.sls.cli.log('Publishing service to the Enterprise Dashboard...', 'Serverless Enterprise')

  let deployment
  try {
    deployment = await parseDeploymentData(ctx)
  } catch (error) {
    throw new Error(error)
  }

  const result = await deployment.save()

  ctx.sls.cli.log(
        `Successfully published your service to the Enterprise Dashboard: ${result.dashboardUrl}`, // eslint-disable-line
    'Serverless Enterprise'
  )
}
