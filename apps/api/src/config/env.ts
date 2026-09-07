export const config = {
  PORT: Number(Bun.env.PORT ?? 3000),
  HOST: Bun.env.HOST ?? 'localhost',
  LOG_LEVEL: Bun.env.LOG_LEVEL ?? 'info',
  CORS_ORIGIN: Bun.env.CORS_ORIGIN ?? 'http://localhost:5173',
  DB_FILE_NAME: Bun.env.DB_FILE_NAME ?? 'data/dev.sqlite',
  NODE_ENV: Bun.env.NODE_ENV ?? 'development',
} as const
