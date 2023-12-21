/* eslint-disable no-unused-expressions */
import * as contextProperties from './contextProperties'
import {Context} from "./interfaces/context";

describe('Should read/write properties', () => {
  describe('Should set / get tokens', () => {
    const context: Context = {}
    contextProperties.setTokens({ access_token: 'a', refresh_token: 'b', authSource: 'joe' }, context)

    it('should set the access token', () => {
      expect(contextProperties.getAccessToken(context)).toEqual('a')
    })
    it('should set the refresh token', () => {
      expect(contextProperties.getRefreshToken(context)).toEqual('b')
    })
    it('should set the auth source', () => {
      expect(context.authSource).toEqual('joe')
    })
  })

  describe('Should return null if tokens not present', () => {
    const context = {}

    it('access token', () => {
      expect(contextProperties.getAccessToken(context)).toBeNull()
    })
    it('refresh token', () => {
      expect(contextProperties.getRefreshToken(context)).toBeNull()
    })
  })

  describe('Should know if the context has no tokens', () => {
    it('null', () => {
      expect(contextProperties.hasTokens(null)).toBe(false)
    })
    it('undefined', () => {
      expect(contextProperties.hasTokens(undefined)).toBe(false)
    })
    it('empty object', () => {
      expect(contextProperties.hasTokens({})).toBe(false)
    })
  })

  describe('Should know if the context has tokens', () => {
    const context = {}

    it('no tokens', () => {
      contextProperties.setTokens({ access_token: null, refresh_token: null, authSource: null }, context)
      expect(contextProperties.hasTokens(context)).toBe(false)
    })
    it('empty tokens', () => {
      contextProperties.setTokens({ access_token: '', refresh_token: '', authSource: null }, context)
      expect(contextProperties.hasTokens(context)).toBe(false)
    })
    it('only access token', () => {
      contextProperties.setTokens({ access_token: 'a', refresh_token: '', authSource: null }, context)
      expect(contextProperties.hasTokens(context)).toBe(false)
    })
    it('only refresh tokenb', () => {
      contextProperties.setTokens({ access_token: '', refresh_token: 'b', authSource: null }, context)
      expect(contextProperties.hasTokens(context)).toBe(false)
    })
    it('both tokens', () => {
      contextProperties.setTokens({ access_token: 'a', refresh_token: 'b', authSource: null }, context)
      expect(contextProperties.hasTokens(context)).toBe(true)
    })
  })

  it('Should set the request pagination properties', () => {
    const context: Context = {}
    contextProperties.setRequestPagination(context, { offset: 1, size: 10 })
    expect(contextProperties.getRequestPagination(context)).toEqual({
      'page-offset': 1,
      'page-limit': 10,
    })
  })

  it('Should return an empty requestPagination object even when the setter has not been called', () => {
    expect(contextProperties.getRequestPagination({})).toEqual({})
  })

  it('Should set the response pagination properties', () => {
    const context = {}
    contextProperties.setResponsePagination(context, {
      'PAGE-offset': '1',
      'page-LIMIT': '10',
      'Sort-Fields': 'a,b',
      'sort-order': 'ASC',
      'total-records': '100',
    })
    expect(contextProperties.getResponsePagination(context)).toEqual({ totalElements: 100, offset: 1, limit: 10 })
  })

  it('Should return an empty responsePagination object if no values were set', () => {
    const context = {}
    contextProperties.setResponsePagination(context, {})
    expect(contextProperties.getResponsePagination(context)).toEqual({})
  })

  it('Should return an empty responsePagination object even when the setter has not been called', () => {
    expect(contextProperties.getResponsePagination({})).toEqual({})
  })
})
