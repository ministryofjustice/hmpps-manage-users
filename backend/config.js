const { AgentConfig, get } = require('./apiConfig')

const toInt = (envVar, defaultVal) => (envVar ? parseInt(envVar, 10) : defaultVal)

module.exports = {
  app: {
    port: process.env.PORT || 3001,
    production: process.env.NODE_ENV === 'production',
    dpsEndpointUrl: process.env.DPS_ENDPOINT_URL || 'http://localhost:3000',
    supportUrl: process.env.SUPPORT_URL || 'http://localhost:3003',
    tokenRefreshThresholdSeconds: toInt(process.env.TOKEN_REFRESH_THRESHOLD_SECONDS, 60),
    applicationCaseload: process.env.APPLICATION_CASELOAD || 'NWEB',
    url: process.env.MANAGE_HMPPS_USERS_URL || `http://localhost:${process.env.PORT || 3001}`,
  },

  analytics: {
    googleTagManagerId: process.env.GOOGLE_TAG_MANAGER_ID,
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
      clientId: process.env.API_CLIENT_ID || 'manage-user-accounts-ui',
      clientSecret: process.env.API_CLIENT_SECRET || 'clientsecret',
    },
    manageusers: {
      url: process.env.MANAGE_USERS_API_ENDPOINT_URL || 'http://localhost:9091',
      timeout: {
        response: toInt(process.env.MANAGE_USERS_API_ENDPOINT_TIMEOUT_RESPONSE, 60000),
        deadline: toInt(process.env.MANAGE_USERS_API_ENDPOINT_TIMEOUT_DEADLINE, 60000),
      },
      agent: new AgentConfig(Number(get('MANAGE_USERS_API_ENDPOINT_TIMEOUT_RESPONSE', 60000))),
    },
    tokenverification: {
      url: process.env.TOKENVERIFICATION_API_URL || 'http://localhost:8100',
      timeoutSeconds: toInt(process.env.TOKENVERIFICATION_API_TIMEOUT_SECONDS, 10),
      enabled: process.env.TOKENVERIFICATION_API_ENABLED === 'true',
    },
    nomisUsersAndRoles: {
      url: process.env.NOMIS_USERS_API_ENDPOINT_URL || 'http://localhost:8082',
      timeoutSeconds: toInt(process.env.NOMIS_USERS_API_ENDPOINT_TIMEOUT_SECONDS, 30),
    },
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    tls_enabled: process.env.REDIS_TLS_ENABLED || 'false',
  },
  featureSwitches: {},
  phaseName: process.env.SYSTEM_PHASE,
  downloadRecordLimit: toInt(process.env.DPS_SEARCH_DOWNLOAD_LINK_LIMIT, 20000),
}
