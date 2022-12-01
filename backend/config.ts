import 'dotenv/config'

// const appPortDefault = 3001
const production = process.env.NODE_ENV === 'production'
const toInt = (envVar: string, defaultVal: number): number => (envVar ? parseInt(envVar, 10) : defaultVal)

function get<T>(name: string, fallback: T, options = { requireInProduction: false }): T | string {
  if (process.env[name]) {
    return process.env[name]
  }
  if (fallback !== undefined && (!production || !options.requireInProduction)) {
    return fallback
  }
  throw new Error(`Missing env var ${name}`)
}

const requiredInProduction = { requireInProduction: true }

export class AgentConfig {
  timeout: number

  constructor(timeout = 8000) {
    this.timeout = timeout
  }
}

export interface ApiConfig {
  url: string
  timeout: {
    response: number
    deadline: number
  }
  agent: AgentConfig
}

export default {
  production,
  https: production,
  staticResourceCacheDuration: 20,
  redis: {
    host: get('REDIS_HOST', 'localhost', requiredInProduction),
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
    tls_enabled: get('REDIS_TLS_ENABLED', 'false'),
  },
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
    hmppsAuth: {
      url: get('HMPPS_AUTH_URL', 'http://localhost:9090/auth', requiredInProduction),
      externalUrl: get('HMPPS_AUTH_EXTERNAL_URL', get('HMPPS_AUTH_URL', 'http://localhost:9090/auth')),
      timeoutSeconds: toInt(process.env.OAUTH_ENDPOINT_TIMEOUT_SECONDS, 10),
      clientId: process.env.API_CLIENT_ID || 'manage-user-accounts-ui',
      clientSecret: process.env.API_CLIENT_SECRET || 'clientsecret',
    },
    manageUsers: {
      url: process.env.MANAGE_USERS_API_ENDPOINT_URL || 'http://localhost:9091',
      timeout: {
        response: toInt(process.env.MANAGE_USERS_API_ENDPOINT_TIMEOUT_RESPONSE, 60000),
        deadline: toInt(process.env.MANAGE_USERS_API_ENDPOINT_TIMEOUT_DEADLINE, 60000),
      },
      agent: new AgentConfig(Number(get('MANAGE_USERS_API_ENDPOINT_TIMEOUT_RESPONSE', 60000))),
    },
    tokenVerification: {
      url: process.env.TOKENVERIFICATION_API_URL || 'http://localhost:8100',
      timeoutSeconds: toInt(process.env.TOKENVERIFICATION_API_TIMEOUT_SECONDS, 10),
      enabled: process.env.TOKENVERIFICATION_API_ENABLED === 'true',
    },
    nomisUsersAndRoles: {
      url: process.env.NOMIS_USERS_API_ENDPOINT_URL || 'http://localhost:8082',
      timeoutSeconds: toInt(process.env.NOMIS_USERS_API_ENDPOINT_TIMEOUT_SECONDS, 30),
    },
  },

  featureSwitches: {},
  phaseName: process.env.SYSTEM_PHASE,
  downloadRecordLimit: toInt(process.env.DPS_SEARCH_DOWNLOAD_LINK_LIMIT, 20000),
}
