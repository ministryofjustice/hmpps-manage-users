export default {}

declare module 'superagent' {
  interface Response {
    req: superagent.Request
    request: superagent.Request
  }
}
