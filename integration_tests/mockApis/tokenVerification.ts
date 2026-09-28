import { SuperAgentRequest } from 'superagent'
import { stubJson, stubPing } from './wiremock'
import { HttpStatusCode } from '../../server/utils/utils'

export default {
  stubPing: (httpStatus = HttpStatusCode.OK): SuperAgentRequest => stubPing('/verification', httpStatus),

  stubVerifyToken: (active = true): SuperAgentRequest =>
    stubJson({
      method: 'POST',
      urlPattern: '/verification/token/verify',
      body: { active },
    }),

  stubRevokeToken: (): SuperAgentRequest =>
    stubJson({
      method: 'DELETE',
      urlPattern: '/verification/token/self',
    }),
}
