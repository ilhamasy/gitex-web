import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  github: {
    token: process.env.GITHUB_TOKEN || '',
  },
  gitlab: {
    token: process.env.GITLAB_TOKEN || '',
  },
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
};

export default config;
