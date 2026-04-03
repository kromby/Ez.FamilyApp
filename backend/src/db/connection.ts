import sql from 'mssql';

const config: sql.config = {
  server: process.env.AZURE_SQL_SERVER!,
  port: 1433,
  database: process.env.AZURE_SQL_DATABASE!,
  // Local dev: SQL auth. Production: managed identity via @azure/identity
  ...(process.env.NODE_ENV === 'production'
    ? {
        authentication: {
          type: 'azure-active-directory-default' as const,
          options: {},
        },
      }
    : {
        user: process.env.AZURE_SQL_USER,
        password: process.env.AZURE_SQL_PASSWORD,
      }),
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
}
