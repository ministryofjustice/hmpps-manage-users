const appPortDefault = 3001
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
    password: process.env.REDIS_AUTH_TOKEN,
    tls_enabled: get('REDIS_TLS_ENABLED', 'false'),
  },
  session: {
    secret: get('SESSION_COOKIE_SECRET', 'app-insecure-default-session', requiredInProduction),
    expiryMinutes: Number(get('WEB_SESSION_TIMEOUT_IN_MINUTES', 120)),
  },
  app: {
    port: parseInt(process.env.PORT, 10) || appPortDefault,
    dpsEndpointUrl: get('DPS_ENDPOINT_URL', 'http://localhost:3000', requiredInProduction),
    supportUrl: get('SUPPORT_URL', 'http://localhost:3003', requiredInProduction),
    tokenRefreshThresholdSeconds: toInt(process.env.TOKEN_REFRESH_THRESHOLD_SECONDS, 60),
    applicationCaseload: get('APPLICATION_CASELOAD', 'NWEB'),
    url: get('MANAGE_HMPPS_USERS_URL', `http://localhost:${process.env.PORT || appPortDefault}`, requiredInProduction),
  },
  analytics: {
    googleTagManagerId: get('GOOGLE_TAG_MANAGER_ID', null),
  },
  apis: {
    hmppsAuth: {
      url: get('HMPPS_AUTH_URL', 'http://localhost:9090/auth', requiredInProduction),
      externalUrl: get('HMPPS_AUTH_EXTERNAL_URL', get('HMPPS_AUTH_URL', 'http://localhost:9090/auth')),
      timeout: {
        response: Number(get('HMPPS_AUTH_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('HMPPS_AUTH_TIMEOUT_DEADLINE', 10000)),
      },
      agent: new AgentConfig(Number(get('HMPPS_AUTH_TIMEOUT_RESPONSE', 10000))),
      apiClientId: get('API_CLIENT_ID', 'manage-user-accounts-ui', requiredInProduction),
      apiClientSecret: get('API_CLIENT_SECRET', 'clientsecret', requiredInProduction),
    },
    manageUsers: {
      url: get('MANAGE_USERS_API_ENDPOINT_URL', 'http://localhost:9091', requiredInProduction),
      timeout: {
        response: Number(get('MANAGE_USERS_API_TIMEOUT_RESPONSE', 10000)),
        deadline: Number(get('MANAGE_USERS_API_TIMEOUT_DEADLINE', 10000)),
      },
    },
    tokenVerification: {
      url: get('TOKEN_VERIFICATION_API_URL', 'http://localhost:8100', requiredInProduction),
      timeout: {
        response: Number(get('TOKEN_VERIFICATION_API_TIMEOUT_RESPONSE', 5000)),
        deadline: Number(get('TOKEN_VERIFICATION_API_TIMEOUT_DEADLINE', 5000)),
      },
      agent: new AgentConfig(Number(get('TOKEN_VERIFICATION_API_TIMEOUT_RESPONSE', 5000))),
      enabled: get('TOKEN_VERIFICATION_ENABLED', 'false') === 'true',
    },
    nomisUsersAndRoles: {
      url: get('NOMIS_USERS_API_ENDPOINT_URL', 'http://localhost:8082', requiredInProduction),
      timeout: {
        response: Number(get('MANAGE_USERS_API_TIMEOUT_RESPONSE', 30000)),
        deadline: Number(get('MANAGE_USERS_API_TIMEOUT_DEADLINE', 30000)),
      },
    },
  },
  downloadRecordLimit: toInt(process.env.DPS_SEARCH_DOWNLOAD_LINK_LIMIT, 20000),
  phaseName: process.env.SYSTEM_PHASE,
}
