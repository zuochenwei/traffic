const { Pool } = require('pg');

const postgis = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'pgrouting',
  password: '841222',
  port: 5432, // 默认 PostgreSQL 端口
});
module.exports = postgis;
