import config from '../config'

export default function cleanUpRedirect(redirectDestination: string): string {
  if (isNotExpectedHost(redirectDestination)) {
    throw new Error('Potential hack attempt detected: foreign redirect URL')
  }
  return stripQueryParams(redirectDestination)
}

function isNotExpectedHost(redirectDestination: string) {
  return isFullUrl(redirectDestination) && hostIsNotEqualToIngressHost(redirectDestination)
}

function isFullUrl(url: string): boolean {
  // Check if url contains a domain name or host
  const fullUrlPattern = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/
  return fullUrlPattern.test(url)
}

function hostIsNotEqualToIngressHost(url: string): boolean {
  const ingressHost = getIngressHost()
  try {
    const urlHost = new URL(url.startsWith('http') ? url : `http://${url}`).host
    return urlHost !== ingressHost
  } catch {
    // If url constructor fails, it's likely not a full url
    return false
  }
}

function getIngressHost(): string {
  // Retrieve the ingress host from environment variables
  const ingressHost = config.app.host
  if (!ingressHost) {
    throw new Error('Ingress host is not defined in the environment variables')
  }
  return ingressHost
}

function stripQueryParams(redirectDestination: string) {
  return redirectDestination.split('?')[0]
}
