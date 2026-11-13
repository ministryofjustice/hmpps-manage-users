import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import setUpCurrentUser from './setUpCurrentUser'
import { Services } from '../services'

const token = jwt.sign({ name: 'john smith', user_id: '123', authorities: ['ROLE_OTHER'] }, 'secret')

describe('setUpCurrentUser', () => {
  const getCurrentUserCaseloads = jest.fn()
  const getUserCaseloads = jest.fn()
  const services = { dpsUserService: { getCurrentUserCaseloads, getUserCaseloads } } as unknown as Services

  const run = async (authSource: string) => {
    const res = { locals: { user: { token, username: 'USER1', authSource } } } as unknown as Response
    const next = jest.fn()
    const handler = setUpCurrentUser(services).stack[0].handle
    await handler({} as Request, res, next)
    return { user: res.locals.user as unknown as Record<string, unknown>, next }
  }

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('fetches the current user caseloads with their own token for nomis users', async () => {
    getCurrentUserCaseloads.mockResolvedValue({ activeCaseload: { id: 'MDI' }, caseloads: [{ id: 'MDI' }] })

    const { user, next } = await run('nomis')

    expect(getCurrentUserCaseloads).toHaveBeenCalledWith(token)
    expect(getUserCaseloads).not.toHaveBeenCalled()
    expect(user.activeCaseload).toEqual({ id: 'MDI' })
    expect(user.caseloads).toEqual([{ id: 'MDI' }])
    expect(user.staffId).toEqual(123)
    expect(next).toHaveBeenCalledWith()
  })

  it('continues without caseloads if fetching them fails', async () => {
    getCurrentUserCaseloads.mockRejectedValue(new Error('boom'))

    const { user, next } = await run('nomis')

    expect(user.activeCaseload).toBeUndefined()
    expect(next).toHaveBeenCalledWith()
  })

  it('does not fetch caseloads for non-nomis users', async () => {
    const { user, next } = await run('delius')

    expect(getCurrentUserCaseloads).not.toHaveBeenCalled()
    expect(user.activeCaseload).toBeUndefined()
    expect(next).toHaveBeenCalledWith()
  })
})
