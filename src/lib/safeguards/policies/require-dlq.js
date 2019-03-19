const { fromPairs } = require('lodash')

const asyncEvents = new Set([
  's3',
  'sns',
  'alexaSkill',
  'iot',
  'cloudwatchEvent',
  'cloudwatchLog',
  'cognitoUserPool',
  'alexaSmartHome'
])
module.exports = function dlqPolicy(policy, service) {
  const {
    declaration: { functions },
    provider: { naming },
    compiled: {
      'cloudformation-template-update-stack.json': { Resources }
    }
  } = service
  const logicalFuncNamesToConfigFuncName = fromPairs(
    Object.keys(functions || {}).map((funcName) => [naming.getLambdaLogicalId(funcName), funcName])
  )

  // for (const [name, { events, onError }] of Object.entries(functions)) {
  for (const [funcName, { Properties, Type }] of Object.entries(Resources)) {
    if (
      Type !== 'AWS::Lambda::Function' ||
      (Properties.DeadLetterConfig && Properties.DeadLetterConfig.TargetArn)
    ) {
      continue
    }
    const events = functions[logicalFuncNamesToConfigFuncName[funcName]].events || []
    const eventTypes = new Set(events.map((ev) => Object.keys(ev)[0]))
    const eventIntersection = new Set([...asyncEvents].filter((x) => eventTypes.has(x)))
    if (events.length === 0 || eventIntersection.size > 0) {
      policy.warn(
        `Function "${
          logicalFuncNamesToConfigFuncName[funcName]
        }" doesn't have a Dead Letter Queue configured.`
      )
    }
  }

  policy.approve()
}

module.exports.docs =
  'https://github.com/serverless/enterprise/blob/master/docs/safeguards.md#ensure-dead-letter-queues-are-attached-to-functions'
