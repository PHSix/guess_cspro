import fs from "node:fs/promises";
import { INPUT_MODE_FILE, OUTPUT_FILE } from "./constants";
import { info } from "node:console";
import path from "node:path";

/**
 * cp out/*.json ../client/public/
 */
export async function syncCopy() {
  return Promise.all([
    fs.copyFile(
      INPUT_MODE_FILE,
      path.resolve(process.cwd(), "../app/public/mode_player_list.json")
    ),

    fs.copyFile(
      OUTPUT_FILE,
      path.resolve(process.cwd(), "../app/public/all_players_data.json")
    ),
  ]);
}

if (process.argv[1] === __filename) {
  (async () => {
    info("开始同步数据...");
    await syncCopy();
    info("已完成同步数据...");
  })();
}
