import config from '../config'

export default function cleanUpRedirect(redirectDestination: string): string {
  if (isNotExpectedHost(redirectDestination)) {
    throw new Error('Potential hack attempt detected: foreign redirect URL')
  }
  return stripQueryParams(redirectDestination)
}

function isNotExpectedHost(redirectDestination: string) {
  const a = isFullUrl(redirectDestination)
  const b = hostIsNotEqualToIngressHost(redirectDestination)
  return a && b
}

function isFullUrl(url: string): boolean {
  const fullUrlPattern = /^(https?:\/\/)?(www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/
  return fullUrlPattern.test(url)
}

function hostIsNotEqualToIngressHost(url: string): boolean {
  const ingressHost = getIngressHost()
  try {
    const urlHost = new URL(url.startsWith('http') ? url : `https://${url}`).host
    return urlHost !== ingressHost
  } catch (error) {
    return false
  }
}

function getIngressHost(): string {
  const ingressHost = config.app.host
  if (!ingressHost) {
    throw new Error('Ingress host is not defined in the environment variables')
  }
  // Normalize to avoid mismatches with URL host parsing
  return new URL(ingressHost.startsWith('http') ? ingressHost : `http://${ingressHost}`).host
}

function stripQueryParams(redirectDestination: string) {
  return redirectDestination.split('?')[0]
}
