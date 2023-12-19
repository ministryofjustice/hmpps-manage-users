export default {}

declare module 'superagent' {
  interface Response {
    request: superagent.Request
  }
}
