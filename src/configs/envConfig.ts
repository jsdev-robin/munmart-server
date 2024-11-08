import dotenv from 'dotenv';
import { ProcessEnv } from '../types/configs/envConfig';

dotenv.config({ path: './.env' });

function validateEnvVariables(env: ProcessEnv): void {
  const requiredVars: Array<keyof ProcessEnv> = [
    'PORT',
    'NODE_ENV',
    'DATABASE_LOCAL',
    'DATABASE_ONLINE',
    'DATABASE_PASSWORD_ONLINE',
    'ACTIVATION_SECRET',
    'CRYPTO_SECRET',
    'EMAIL_USERNAME',
    'EMAIL_PASSWORD',
    'EMAIL_HOST',
    'EMAIL_PORT',
    'EMAIL_FROM',
    'ACCESS_TOKEN',
    'REFRESH_TOKEN',
    'ACCESS_TOKEN_EXPIRE',
    'REFRESH_TOKEN_EXPIRE',
    'REDIS_URL',
    'BYTE_KEY_16',
    'SECRET',
    'SESSION_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'CLIENT_URL',
    'GOOGLE_CALLBACK_URL',
    'GITHUB_CALLBACK_URL',
  ];

  const missingVars = requiredVars.filter(
    (key) => env[key] === undefined || env[key] === ''
  );

  if (missingVars.length > 0) {
    console.error(`Missing environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }
}

const env = process.env as unknown as ProcessEnv;
validateEnvVariables(env);

const {
  PORT = '8000',
  NODE_ENV = 'development',
  DATABASE_LOCAL = '',
  DATABASE_ONLINE = '',
  DATABASE_PASSWORD_ONLINE = '',
  ACTIVATION_SECRET = '',
  CRYPTO_SECRET = '',
  EMAIL_USERNAME = '',
  EMAIL_PASSWORD = '',
  EMAIL_HOST = '',
  EMAIL_PORT = '',
  EMAIL_FROM = '',
  ACCESS_TOKEN = '',
  REFRESH_TOKEN = '',
  ACCESS_TOKEN_EXPIRE = '',
  REFRESH_TOKEN_EXPIRE = '',
  REDIS_URL = '',
  BYTE_KEY_16 = '',
  SECRET = '',
  SESSION_SECRET = '',
  GOOGLE_CLIENT_ID = '',
  GOOGLE_CLIENT_SECRET = '',
  GITHUB_CLIENT_ID = '',
  GITHUB_CLIENT_SECRET = '',
  CLIENT_URL = '',
  GOOGLE_CALLBACK_URL = '',
  GITHUB_CALLBACK_URL = '',
  IPINFO_KEY = '',
} = env;

const ISPRODUCTION = NODE_ENV === 'production';
const DB = ISPRODUCTION
  ? DATABASE_ONLINE.replace('<db_password>', DATABASE_PASSWORD_ONLINE)
  : DATABASE_LOCAL;

const EnvConfig = {
  ISPRODUCTION,
  PORT,
  NODE_ENV,
  DB,
  ACTIVATION_SECRET,
  CRYPTO_SECRET,
  EMAIL_USERNAME,
  EMAIL_PASSWORD,
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_FROM,
  ACCESS_TOKEN,
  REFRESH_TOKEN,
  ACCESS_TOKEN_EXPIRE,
  REFRESH_TOKEN_EXPIRE,
  REDIS_URL,
  BYTE_KEY_16,
  SECRET,
  SESSION_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  CLIENT_URL,
  GOOGLE_CALLBACK_URL,
  GITHUB_CALLBACK_URL,
  IPINFO_KEY,
};

export default EnvConfig;
