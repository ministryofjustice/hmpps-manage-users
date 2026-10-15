import { Request, Response } from 'express'
import { validateFormOrRedirect, flashErrors, formErrorsFromFlash, flashBody, bodyFromFlash } from './formMiddleware'
import { FormError } from '../../interfaces/formError'

describe('form middleware', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: jest.Mock

  beforeEach(() => {
    req = {
      flash: jest.fn(),
    }

    res = {
      redirect: jest.fn(),
    }

    next = jest.fn()
  })

  describe('validateFormOrRedirect', () => {
    it('calls next() when there are no validation errors', async () => {
      const validator = jest.fn().mockReturnValue([])
      req.body = { name: 'test', _csrf: 'token' }

      const handler = validateFormOrRedirect(validator, _req => '/redirect')

      await handler(req as Request, res as Response, next)

      expect(validator).toHaveBeenCalledWith({ name: 'test' }, req, res) // _csrf removed
      expect(req.flash).toHaveBeenCalledWith('requestBody', JSON.stringify({ name: 'test' }))
      expect(res.redirect).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })

    it('redirects and flashes errors when validation fails', async () => {
      const errors: FormError[] = [{ href: 'name', text: 'Required' }]
      const validator = jest.fn().mockReturnValue(errors)
      req.body = { name: '', _csrf: 'token' }

      const handler = validateFormOrRedirect(validator, _req => '/redirect')

      await handler(req as Request, res as Response, next)

      expect(req.flash).toHaveBeenCalledWith('requestBody', JSON.stringify({ name: '' }))
      expect(req.flash).toHaveBeenCalledWith('errors', errors)
      expect(res.redirect).toHaveBeenCalledWith('/redirect')
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('flashErrors', () => {
    it('stores errors using req.flash', () => {
      const errors: FormError[] = [{ href: 'email', text: 'Invalid' }]
      flashErrors(req as Request, errors)

      expect(req.flash).toHaveBeenCalledWith('errors', errors)
    })
  })

  describe('formErrorsFromFlash', () => {
    it('returns flashed errors when they exist', () => {
      const errors: FormError[] = [{ href: 'email', text: 'Invalid' }]
      ;(req.flash as jest.Mock).mockReturnValue(errors)

      const result = formErrorsFromFlash(req as Request)
      expect(result).toEqual(errors)
    })

    it('returns an empty array when no errors flashed', () => {
      ;(req.flash as jest.Mock).mockReturnValue([])

      const result = formErrorsFromFlash(req as Request)
      expect(result).toEqual([])
    })
  })

  describe('flashBody', () => {
    it('stores the request body as JSON string', () => {
      const body = { name: 'Mike' }

      flashBody(req as Request, body)

      expect(req.flash).toHaveBeenCalledWith('requestBody', JSON.stringify(body))
    })
  })

  describe('bodyFromFlash', () => {
    it('returns parsed body when present', () => {
      const body = { name: 'Mike' }
      ;(req.flash as jest.Mock).mockReturnValue([JSON.stringify(body)])

      const result = bodyFromFlash<typeof body>(req as Request)
      expect(result).toEqual(body)
    })

    it('returns empty object when no flashed body found', () => {
      ;(req.flash as jest.Mock).mockReturnValue([])

      const result = bodyFromFlash(req as Request)
      expect(result).toEqual({})
    })
  })
})
