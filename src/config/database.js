const mysql = require('mysql2/promise');
require('dotenv').config();

const connectionUri =
    process.env.DATABASE_URL ||
    process.env.MYSQL_URL ||
    process.env.MYSQL_PUBLIC_URL;

const poolConfig = {
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_LIMIT || 10),
    queueLimit: 0
};

const pool = connectionUri
    ? (() => {
          const dbUrl = new URL(connectionUri);

          return mysql.createPool({
              host: dbUrl.hostname,
              port: Number(dbUrl.port || 3306),
              user: decodeURIComponent(dbUrl.username),
              password: decodeURIComponent(dbUrl.password),
              database: dbUrl.pathname.replace(/^\//, ''),
              ...poolConfig
          });
      })()
    : mysql.createPool({
          host: process.env.DB_HOST || process.env.MYSQLHOST,
          port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
          user: process.env.DB_USER || process.env.MYSQLUSER,
          password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
          database: process.env.DB_NAME || process.env.MYSQLDATABASE,
          ...poolConfig
      });

module.exports = pool;