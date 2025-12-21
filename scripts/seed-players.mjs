import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function seedPlayers() {
  // 读取JSON数据
  const dataPath = path.join(__dirname, '../players_data.json');
  const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  // 创建数据库连接
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'guess_cspro',
  });

  try {
    // 清空现有数据
    await connection.execute('DELETE FROM players');
    console.log('已清空现有选手数据');

    // 插入新数据
    let insertedCount = 0;
    for (const [key, playerData] of Object.entries(jsonData)) {
      const playerName = playerData.player || key;
      const team = playerData.team || 'Unknown';
      const country = playerData.country || 'Unknown';
      const birthYear = playerData.birth_year || 2000;
      const majorMaps = parseInt(playerData.Maps) || 0;
      const role = playerData.role || 'Unknown';
      const hltv_link = playerData.link || null;

      try {
        await connection.execute(
          'INSERT INTO players (playerName, team, country, birthYear, majorMaps, role, hltv_link) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [playerName, team, country, birthYear, majorMaps, role, hltv_link]
        );
        insertedCount++;
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
          console.error(`插入选手 ${playerName} 失败:`, error.message);
        }
      }
    }

    console.log(`成功插入 ${insertedCount} 名选手`);

    // 验证数据
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM players');
    console.log(`数据库中现有 ${rows[0].count} 名选手`);

  } catch (error) {
    console.error('数据导入失败:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedPlayers().then(() => {
  console.log('数据导入完成');
  process.exit(0);
});
