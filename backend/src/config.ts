// Configuración leída de variables de entorno (con valores por defecto para desarrollo)
export const config = {
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET ??
    `${process.env.JWT_SECRET ?? 'dev-secret-change-me'}-refresh`,
  accessTokenTtlSeconds: 15 * 60,
  refreshTokenTtlSeconds: 7 * 24 * 60 * 60,
  // En producción con HTTPS debe ser true
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:4200')
    .split(',')
    .map((origin) => origin.trim()),
  loginRateLimit: Number(process.env.LOGIN_RATE_LIMIT ?? 5),
};

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';
