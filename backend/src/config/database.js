require('dotenv').config();

// Parse DATABASE_URL if available, otherwise use individual parameters
const getConnectionConfig = () => {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      username: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      host: url.hostname,
      port: url.port,
      dialect: 'postgres'
    };
  }
  
  return {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    dialect: 'postgres'
  };
};

const baseConfig = getConnectionConfig();

module.exports = {
  development: {
    ...baseConfig,
    logging: console.log
  },
  test: {
    ...baseConfig,
    logging: false
  },
  production: {
    ...baseConfig,
    logging: false
  }
}; 