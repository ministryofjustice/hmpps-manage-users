import superagent from 'superagent'
import Agent, { HttpsAgent } from 'agentkeepalive'
import logger from '../../logger'
import { getHeaders } from './axios-config-decorators'
import { Context } from '../interfaces/context'

export interface ClientFactoryParams {
  baseUrl: string
  timeout: number
}

export interface OAuthEnabledClient {
  get: (context: Context, path: string, resultLimit?: number) => Promise<superagent.Response>
  post: (context: Context, path: string, body?: unknown) => Promise<superagent.Response>
  put: (context: Context, path: string, body: unknown) => Promise<superagent.Response>
  del: (context: Context, path: string, body?: unknown) => Promise<superagent.Response>
}

const resultLogger = (result: superagent.Response) => {
  logger.debug(`${result.req.method} ${result.req.path} ${result.status}`)
  return result
}

const errorLogger = (error: superagent.ResponseError) => {
  const status = error.response ? error.response.status : '-'
  const responseData = error.response ? error.response.body : '-'
  if (error.response && error.response.req) {
    logger.warn(
      `API error in ${error.response.req.method} ${error.response.req.path} ${status} ${error.message} ${responseData}`,
    )
  } else logger.warn(`API error with message ${error.message}`)
  return error
}

export const oauthEnabledClientFactory = (params: ClientFactoryParams): OAuthEnabledClient => {
  const { baseUrl, timeout } = params
  const remoteUrl = baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl

  const agentOptions = {
    maxSockets: 100,
    maxFreeSockets: 10,
    freeSocketTimeout: 30000,
  }
  const keepaliveAgent = remoteUrl.startsWith('https') ? new HttpsAgent(agentOptions) : new Agent(agentOptions)

  const get = (context: Context, path: string, resultLimit?: number) =>
    new Promise<superagent.Response>((resolve, reject) => {
      superagent
        .get(remoteUrl + path)
        .agent(keepaliveAgent)
        .set(getHeaders(context, resultLimit))
        .retry(2, (err, res) => {
          if (err) logger.info(`Retry handler found API error with ${err.code} ${err.message}`)
          return undefined
        })
        .timeout({ deadline: timeout / 3 })
        .end((error, response: superagent.Response) => {
          if (error) reject(errorLogger(error))
          else if (response) resolve(resultLogger(response))
        })
    })

  const post = (context: Context, path: string, body: string | object) =>
    new Promise<superagent.Response>((resolve, reject) => {
      superagent
        .post(remoteUrl + path)
        .send(body)
        .set(getHeaders(context))
        .end((error, response: superagent.Response) => {
          if (error) reject(errorLogger(error))
          else if (response) resolve(resultLogger(response))
        })
    })

  const put = (context: Context, path: string, body: string | object) =>
    new Promise<superagent.Response>((resolve, reject) => {
      superagent
        .put(remoteUrl + path)
        .send(body)
        .set(getHeaders(context))
        .end((error, response: superagent.Response) => {
          if (error) reject(errorLogger(error))
          else if (response) resolve(resultLogger(response))
        })
    })

  const del = (context: Context, path: string, body: string | object) =>
    new Promise<superagent.Response>((resolve, reject) => {
      superagent
        .del(remoteUrl + path)
        .send(body)
        .set(getHeaders(context))
        .end((error, response: superagent.Response) => {
          if (error) reject(errorLogger(error))
          else if (response) resolve(resultLogger(response))
        })
    })

  return {
    get,
    post,
    put,
    del,
  }
}

export default oauthEnabledClientFactory
