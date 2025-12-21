import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function loadPlayers() {
  // 读取JSON数据
  const dataPath = path.join(__dirname, '../players_data.json');
  console.log('Reading from:', dataPath);
  
  if (!fs.existsSync(dataPath)) {
    console.error('File not found:', dataPath);
    process.exit(1);
  }
  
  const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  console.log('Loaded', Object.keys(jsonData).length, 'players from JSON');

  // 使用DATABASE_URL连接
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const connection = await mysql.createConnection(dbUrl);

  try {
    // 清空现有数据
    console.log('Clearing existing players...');
    await connection.execute('DELETE FROM players');

    // 插入新数据
    let insertedCount = 0;
    let errorCount = 0;
    
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
          console.error(`Error inserting ${playerName}:`, error.message);
          errorCount++;
        }
      }
    }

    console.log(`Successfully inserted ${insertedCount} players`);
    if (errorCount > 0) {
      console.log(`${errorCount} errors occurred`);
    }

    // 验证数据
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM players');
    console.log(`Database now contains ${rows[0].count} players`);

  } catch (error) {
    console.error('Error during data load:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

loadPlayers().then(() => {
  console.log('Data load completed successfully');
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
