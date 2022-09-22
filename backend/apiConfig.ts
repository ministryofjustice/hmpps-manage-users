import 'dotenv/config'

const production = process.env.NODE_ENV === 'production'
type EnvOptions = { requireInProduction: boolean }
const requiredInProduction: EnvOptions = { requireInProduction: true }
const notRequiredInProduction: EnvOptions = { requireInProduction: false }

function get<T>(name: string, fallback: T, options: EnvOptions = notRequiredInProduction): T | string {
  if (process.env[name]) {
    return process.env[name]
  }
  if (fallback !== undefined && (!production || !options.requireInProduction)) {
    return fallback
  }
  throw new Error(`Missing env var ${name}`)
}

export class AgentConfig {
  constructor(readonly timeout = 8000) {
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
