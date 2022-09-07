export default {}

declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number
  }
}

export declare global {
  namespace Express {
    interface Request {
      verified?: boolean
      user: {
        username: string
        token: string
      }
      flash(type: string, message: Array<Record<string, string>>): number
      flash(message: string): Array<Record<string, string>>
      logout(done: (err: unknown) => void): void
    }
  }
}
