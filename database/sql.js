const mysql = require('mysql2/promise');

const dbcon = mysql.createPool({
  host: process.env.DATABASE_HOST,
  port: process.env.DATABASE_PORT,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 10
})

// DB 연결 테스트
async function testDBConnection() {
  try {
      const connection = await dbcon.getConnection();
      console.log('DB Connected Successfully');
      connection.release(); // 연결 해제
  } catch (error) {
      console.error('DB Connection Failed:', error);
  }
}

testDBConnection();

module.exports = dbcon;
