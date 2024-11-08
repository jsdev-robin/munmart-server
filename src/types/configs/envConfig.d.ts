export interface ProcessEnv {
  PORT?: string;
  NODE_ENV?: 'development' | 'production';
  DATABASE_LOCAL?: string;
  DATABASE_ONLINE?: string;
  DATABASE_PASSWORD_ONLINE?: string;
  ACTIVATION_SECRET?: string;
  CRYPTO_SECRET?: string;
  EMAIL_USERNAME?: string;
  EMAIL_PASSWORD?: string;
  EMAIL_HOST?: string;
  EMAIL_PORT?: string;
  EMAIL_FROM?: string;
  ACCESS_TOKEN?: string;
  REFRESH_TOKEN?: string;
  ACCESS_TOKEN_EXPIRE?: string;
  REFRESH_TOKEN_EXPIRE?: string;
  REDIS_URL?: string;
  BYTE_KEY_16?: string;
  SECRET?: string;
  SESSION_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  CLIENT_URL?: string;
  GOOGLE_CALLBACK_URL?: string;
  GITHUB_CALLBACK_URL?: string;
}