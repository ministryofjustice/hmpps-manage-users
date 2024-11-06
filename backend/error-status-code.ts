interface ErrorData {
  code?: string
  response?: {
    status?: number
  }
}

const errorStatusCode = (error: ErrorData): number => {
  if (error) {
    if (error.response && error.response.status) return error.response.status
    if (error.code === 'ECONNREFUSED') return 503
  }

  return 500
}
export default errorStatusCode
