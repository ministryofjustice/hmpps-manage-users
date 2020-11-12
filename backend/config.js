const toInt = (envVar, defaultVal) => (envVar ? parseInt(envVar, 10) : defaultVal)

module.exports = {
  app: {
    port: process.env.PORT || 3001,
    production: process.env.NODE_ENV === 'production',
    disableWebpack: process.env.DISABLE_WEBPACK === 'true',
    notmEndpointUrl: process.env.NN_ENDPOINT_URL || 'http://localhost:3000/',
    dpsEndpointUrl: process.env.DPS_ENDPOINT_URL || 'http://localhost:3002',
    supportUrl: process.env.SUPPORT_URL || 'http://localhost:3003',
    tokenRefreshThresholdSeconds: toInt(process.env.TOKEN_REFRESH_THRESHOLD_SECONDS, 60),
    applicationCaseload: process.env.APPLICATION_CASELOAD || 'NWEB',
    url: process.env.MANAGE_HMPPS_USERS_URL || `http://localhost:${process.env.PORT || 3001}/`,
  },

  analytics: {
    googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID,
  },

  hmppsCookie: {
    name: process.env.HMPPS_COOKIE_NAME || 'hmpps-session-dev',
    domain: process.env.HMPPS_COOKIE_DOMAIN || 'localhost',
    expiryMinutes: toInt(process.env.WEB_SESSION_TIMEOUT_IN_MINUTES, 60),
    sessionSecret: process.env.SESSION_COOKIE_SECRET || 'notm-insecure-session',
  },
  apis: {
    oauth2: {
      url: process.env.OAUTH_ENDPOINT_URL || 'http://localhost:9090/auth',
      ui_url: process.env.OAUTH_ENDPOINT_UI_URL || process.env.OAUTH_ENDPOINT_URL || 'http://localhost:9090/auth',
      timeoutSeconds: toInt(process.env.OAUTH_ENDPOINT_TIMEOUT_SECONDS, 10),
      clientId: process.env.API_CLIENT_ID || 'elite2apiclient',
      clientSecret: process.env.API_CLIENT_SECRET || 'clientsecret',
    },
    prison: {
      url: process.env.API_ENDPOINT_URL || 'http://localhost:8080',
      timeoutSeconds: toInt(process.env.API_ENDPOINT_TIMEOUT_SECONDS, 30),
    },
    tokenverification: {
      url: process.env.TOKENVERIFICATION_API_URL || 'http://localhost:8100',
      timeoutSeconds: toInt(process.env.TOKENVERIFICATION_API_TIMEOUT_SECONDS, 10),
      enabled: process.env.TOKENVERIFICATION_API_ENABLED === 'true',
    },
  },

  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
  },
}
