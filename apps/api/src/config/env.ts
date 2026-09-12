export const config = {
  get PORT() {
    return Number(Bun.env.PORT ?? 3000)
  },
  get HOST() {
    return Bun.env.HOST ?? 'localhost'
  },
  get LOG_LEVEL() {
    return Bun.env.LOG_LEVEL ?? 'info'
  },
  get CORS_ORIGIN() {
    return Bun.env.CORS_ORIGIN ?? 'http://localhost:5173'
  },
  get DB_FILE_NAME() {
    return Bun.env.DB_FILE_NAME ?? 'data/dev.sqlite'
  },
  get NODE_ENV() {
    return Bun.env.NODE_ENV ?? 'development'
  },
  get SESSION_SECRET() {
    return Bun.env.SESSION_SECRET ?? 'classroom-dev-session-secret-key!'
  },
}
