import promClient from 'prom-client'
import { createMetricsApp } from './monitoring/metricsApp'
import createApp from './app'

promClient.collectDefaultMetrics()

const app = createApp()
const metricsApp = createMetricsApp()

export { app, metricsApp }
