import express, { Router, Response } from 'express'
import helmet from 'helmet'
import crypto from 'crypto'
import config from '../config'

export default function setUpWebSecurity(): Router {
  const router = express.Router()

  // Secure code best practice - see:
  // 1. https://expressjs.com/en/advanced/best-practice-security.html,
  // 2. https://www.npmjs.com/package/helmet
  router.use((req, res, next) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('base64')
    next()
  })

  // cdnjs.cloudflare.com is only added to scriptSrc/styleSrc in non-production environments
  // to support highlight.js on the /debug/session/view page, which is itself only available locally.
  const debugScriptSrc = config.app.production ? [] : ['cdnjs.cloudflare.com']
  const debugStyleSrc = config.app.production ? [] : ['cdnjs.cloudflare.com']

  router.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          // Hash allows inline script pulled in from https://github.com/alphagov/govuk-frontend/blob/master/src/govuk/template.njk
          scriptSrc: [
            "'self'",
            (req, res: Response) => `'nonce-${res.locals.cspNonce}'`,
            'code.jquery.com',
            '*.googletagmanager.com',
            'www.google-analytics.com',
            ...debugScriptSrc,
            "'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU='",
          ],
          imgSrc: ["'self'", '*.googletagmanager.com', '*.google-analytics.com', 'code.jquery.com'],
          connectSrc: ["'self'", '*.googletagmanager.com', '*.google-analytics.com', '*.analytics.google.com'],
          styleSrc: ["'self'", 'code.jquery.com', ...debugStyleSrc],
          fontSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: true,
    }),
  )
  return router
}
