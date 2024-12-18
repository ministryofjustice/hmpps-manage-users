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

const serviceName = 'hmpps-manage-users'

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
  serviceName,
  https: production,
  productId: get('PRODUCT_ID', 'DPS017', requiredInProduction),
  staticResourceCacheDuration: 20,
  redis: {
    host: get('REDIS_HOST', 'localhost', requiredInProduction),
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
    tls_enabled: get('REDIS_TLS_ENABLED', 'false'),
    enabled: get('REDIS_ENABLED', 'true') === 'true',
  },
  app: {
    port: process.env.PORT || 3001,
    production: process.env.NODE_ENV === 'production',
    dpsEndpointUrl: process.env.DPS_ENDPOINT_URL || 'http://localhost:3000',
    supportUrl: process.env.SUPPORT_URL || 'http://localhost:3003',
    tokenRefreshThresholdSeconds: toInt(process.env.TOKEN_REFRESH_THRESHOLD_SECONDS, 60),
    applicationCaseload: process.env.APPLICATION_CASELOAD || 'NWEB',
    url: process.env.MANAGE_HMPPS_USERS_URL || `http://localhost:${process.env.PORT || 3001}`,
    host: process.env.host || `localhost:${process.env.PORT || 3001}`,
  },
  session: {
    secret: get('SESSION_SECRET', 'notm-insecure-session', requiredInProduction),
    expiryMinutes: Number(get('WEB_SESSION_TIMEOUT_IN_MINUTES', 120)),
  },
  apis: {
    audit: {
      region: get('AUDIT_SQS_REGION', 'eu-west-2', requiredInProduction),
      queueUrl: get('AUDIT_SQS_QUEUE_URL', 'http://localhost:4566/000000000000/mainQueue', requiredInProduction),
      serviceName: get('AUDIT_SERVICE_NAME', serviceName, requiredInProduction),
      enabled: get('AUDIT_ENABLED', 'true') === 'true',
    },
    hmppsAuth: {
      url: get('HMPPS_AUTH_URL', 'http://localhost:9090/auth', requiredInProduction),
      externalUrl: get('HMPPS_AUTH_EXTERNAL_URL', get('HMPPS_AUTH_URL', 'http://localhost:9090/auth')),
      timeoutSeconds: Number(get('HMPPS_AUTH_ENDPOINT_TIMEOUT_SECONDS', 10)),
      apiClientId: get('API_CLIENT_ID', 'manage-user-accounts-ui', requiredInProduction),
      apiClientSecret: get('API_CLIENT_SECRET', 'clientsecret', requiredInProduction),
    },
    manageUsers: {
      url: get('MANAGE_USERS_API_ENDPOINT_URL', 'http://localhost:9091', requiredInProduction),
      timeout: {
        response: Number(get('MANAGE_USERS_API_ENDPOINT_TIMEOUT_RESPONSE', 60000)),
        deadline: Number(get('MANAGE_USERS_API_ENDPOINT_TIMEOUT_DEADLINE', 60000)),
      },
      agent: new AgentConfig(Number(get('MANAGE_USERS_API_ENDPOINT_TIMEOUT_RESPONSE', 60000))),
    },
    tokenVerification: {
      url: get('TOKEN_VERIFICATION_API_URL', 'http://localhost:8100', requiredInProduction),
      timeoutSeconds: Number(get('TOKEN_VERIFICATION_API_TIMEOUT_SECONDS', 10)),
      enabled: get('TOKEN_VERIFICATION_ENABLED', 'false') === 'true',
    },
  },
  analytics: {
    googleTagManagerId: get('GOOGLE_TAG_MANAGER_ID', ''),
  },
  hmppsCookie: {
    name: get('HMPPS_COOKIE_NAME', 'hmpps-session-dev'),
    domain: get('HMPPS_COOKIE_DOMAIN', 'localhost'),
  },
  featureSwitches: {},
  phaseName: get('SYSTEM_PHASE', ''),
  downloadRecordLimit: Number(get('DPS_SEARCH_DOWNLOAD_LINK_LIMIT', 20000)),
}
