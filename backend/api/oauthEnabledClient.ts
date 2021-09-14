import superagent, { Response } from 'superagent'
import { Readable } from 'stream'
import Agent, { HttpsAgent } from 'agentkeepalive'
import logger from '../log'

import { getHeaders, RequestContext } from './axios-config-decorators'

const resultLogger = (result?: { req?: { method: unknown; path: unknown }; status: unknown }) => {
  logger.debug(`${result?.req?.method} ${result?.req?.path} ${result?.status}`)
  return result
}

const errorLogger = (error: {
  response?: { body: unknown; status: string; req?: { method: unknown; path: unknown } }
  message: unknown
}) => {
  const status = error.response ? error.response.status : '-'
  const responseData = error.response ? error.response.body : '-'
  if (error.response && error.response.req) {
    logger.warn(
      `API error in ${error.response.req.method} ${error.response.req.path} ${status} ${error.message} ${responseData}`,
    )
  } else logger.warn(`API error with message ${error.message}`)
  return error
}

/**
 * Build a client for the supplied configuration. The client wraps axios get, post, put etc while ensuring that
 * the remote calls carry valid oauth headers.
 *
 * @param {Object} params The base url to be used with the client's get and post
 * @param {string} params.baseUrl The base url to be used with the client's get and post
 * @param {number} params.timeout The timeout to apply to get and post.
 * @returns { {
 *     get: (context: any, path: string, resultLimit?: number) => Promise<any>
 *     getWithCustomTimeout: (context: any, path: string, param : object) => Promise<any>
 *     post: (context: any, path: string, body: any) => Promise<any>
 *     pipe: (context: any, path: string, body: any, options?: object) => Promise<any>
 *     put: (context: any, path: string, body: any) => Promise<any>
 *     del: (context: any, path: string, body: any) => Promise<any>
 *     getStream: (context: any, path: string) => Promise<any>
 * }}
 */

const factory = ({ baseUrl, timeout }: { baseUrl: string; timeout: number }) => {
  // strip off any excess / from the required url
  const remoteUrl = baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl

  const agentOptions = {
    maxSockets: 100,
    maxFreeSockets: 10,
    freeSocketTimeout: 30000,
  }
  const keepaliveAgent = remoteUrl.startsWith('https') ? new HttpsAgent(agentOptions) : new Agent(agentOptions)

  /**
   * A superagent GET request with Oauth token
   *
   *
   * @param {any} context A request scoped context. Holds OAuth tokens and pagination information for the request
   * @param {string} path relative path to get, starting with /
   * @param {number} resultLimit - the maximum number of results that a Get request should return.  Becomes the value of the 'page-limit' request header.
   *        The header isn't set if resultLimit is falsy.
   * @returns {Promise<any>} A Promise which settles to the superagent result object if the promise is resolved, otherwise to the 'error' object.
   */
  const get = (context: RequestContext, path: string, resultLimit: number | undefined = undefined) =>
    new Promise((resolve, reject) => {
      superagent
        .get(remoteUrl + path)
        .agent(keepaliveAgent)
        .set(getHeaders(context, resultLimit))
        .retry(2, (err, res) => {
          if (err) logger.info(`Retry handler found API error with ${err.code} ${err.message}`)
          return undefined // retry handler only for logging retries, not to influence retry logic
        })
        .timeout({ deadline: timeout / 3 })
        .end((error, response) => {
          if (error) reject(errorLogger(error))
          else if (response) resolve(resultLogger(response))
        })
    })

  /**
   * A superagent GET request with Oauth token with custom timeout value
   *
   * @param {any} context A request scoped context. Holds OAuth tokens and pagination information for the request
   * @param {string} path relative path to get, starting with /
   * @param {object} params
   * @param {number} params.resultLimit - the maximum number of results that a Get request should return.  Becomes the value of the 'page-limit' request header.
   *        The header isn't set if resultLimit is falsy.
   * @param {number} params.customTimeout value in milliseconds to override default timeout
   * @returns {Promise<any>} A Promise which settles to the superagent result object if the promise is resolved, otherwise to the 'error' object.
   */
  const getWithCustomTimeout = (
    context: RequestContext,
    path: string,
    { resultLimit, customTimeout }: { resultLimit: number; customTimeout: number },
  ) =>
    new Promise((resolve, reject) => {
      superagent
        .get(remoteUrl + path)
        .agent(keepaliveAgent)
        .set(getHeaders(context, resultLimit))
        .retry(2, (err, res) => {
          if (err) logger.info(`Retry handler found API error with ${err.code} ${err.message}`)
          return undefined // retry handler only for logging retries, not to influence retry logic
        })
        .timeout({ deadline: customTimeout || timeout })
        .end((error, response) => {
          if (error) reject(errorLogger(error))
          else if (response) resolve(resultLogger(response))
        })
    })

  /**
   * An superagent POST with Oauth token refresh and retry behaviour
   * @param {any} context A request scoped context. Holds OAuth tokens and pagination information for the request
   * @param {string} path relative path to post to, starting with /
   * @param {any} body
   * @returns {any} A Promise which resolves to the superagent result object, or the superagent error object if it is rejected
   */
  const post = (context: RequestContext, path: string, body: string) =>
    new Promise((resolve, reject) => {
      superagent
        .post(remoteUrl + path)
        .send(body)
        .set(getHeaders(context))
        .end((error, response) => {
          if (error) reject(errorLogger(error))
          else if (response) resolve(resultLogger(response))
        })
    })

  const put = (context: RequestContext, path: string, body: string | undefined = undefined) =>
    new Promise((resolve, reject) => {
      superagent
        .put(remoteUrl + path)
        .send(body)
        .set(getHeaders(context))
        .end((error, response) => {
          if (error) reject(errorLogger(error))
          else if (response) resolve(resultLogger(response))
        })
    })

  const del = (context: RequestContext, path: string, body: string | undefined = undefined) =>
    new Promise((resolve, reject) => {
      superagent
        .del(remoteUrl + path)
        .send(body)
        .set(getHeaders(context))
        .end((error, response) => {
          if (error) reject(errorLogger(error))
          else if (response) resolve(resultLogger(response))
        })
    })

  const getStream = (context: RequestContext, path: string) =>
    new Promise((resolve, reject) => {
      superagent
        .get(remoteUrl + path)
        .agent(keepaliveAgent)
        .set(getHeaders(context))
        .retry(2, (err, res) => {
          if (err) logger.info(`Retry handler found API error with ${err.code} ${err.message}`)
          return undefined // retry handler only for logging retries, not to influence retry logic
        })
        .timeout({ deadline: timeout / 3 })
        .end((error, response) => {
          if (error) reject(errorLogger(error))
          else if (response) {
            resultLogger(response)
            const s = new Readable()
            // eslint-disable-next-line no-underscore-dangle
            s._read = () => {
              /* do nothing */
            }
            s.push(response.body)
            s.push(null)
            resolve(s)
          }
        })
    })

  const pipe = (
    context: RequestContext,
    path: string,
    pipeTo: NodeJS.WritableStream & Response,
    options = { retry: 2 },
  ) => {
    const url = remoteUrl + path
    const retryHandler = (err: { code: string; message: string }) => {
      if (err) logger.info(`Retry handler found API error with ${err.code} ${err.message}`)
      return undefined // retry handler only for logging retries, not to influence retry logic
    }
    const deadline = { deadline: timeout / (options.retry + 1) }
    return superagent
      .get(url)
      .agent(keepaliveAgent)
      .set(getHeaders(context))
      .retry(options.retry, retryHandler)
      .timeout(deadline)
      .on('response', (res) => {
        pipeTo.header(res.header)
      })
      .pipe(pipeTo)
  }

  return {
    get,
    getWithCustomTimeout,
    getStream,
    pipe,
    post,
    put,
    del,
  }
}

export type ClientFactory = typeof factory
export type Client = ReturnType<ClientFactory>
export default factory
