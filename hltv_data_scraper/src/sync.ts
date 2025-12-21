import fs from "node:fs/promises";
import { readJsonFile, writeOutputJsonFile } from "./utils";
import {
	INPUT_MODE_FILE,
	OUTPUT_FILE,
	OUTPUT_MODE,
	OUTPUT_NORMAL_FILE,
	OUTPUT_YLG_FILE,
} from "./constants";
import { info } from "node:console";
import path from "node:path";
/**
 * 同步数据到normal和ylg模式
 */
export async function sync() {
	/**
	 * 现有的所有数据
	 */
	const allPlayersData: Record<string, unknown> =
		await readJsonFile(OUTPUT_FILE);
	const modePlayerList: Record<string, string[]> =
		await readJsonFile(INPUT_MODE_FILE);

	const { ylg, normal } = modePlayerList;

	const ylgJson = {};

	const normalJson = {};

	for (const [id, player] of Object.entries(allPlayersData)) {
		if (ylg.includes(id)) {
			ylgJson[id] = player;
		}

		if (normal.includes(id)) {
			normalJson[id] = player;
		}
	}

	await writeOutputJsonFile(OUTPUT_MODE.YLG, ylgJson);
	await writeOutputJsonFile(OUTPUT_MODE.NORMAL, normalJson);
}

/**
 * cp out/*.json ../client/public/
 */
export async function syncCopy() {
	return Promise.all([
		fs.copyFile(
			OUTPUT_FILE,
			path.resolve(process.cwd(), "../client/public/all_players_data.json"),
		),

		fs.copyFile(
			OUTPUT_YLG_FILE,
			path.resolve(process.cwd(), "../client/public/ylg_data.json"),
		),

		fs.copyFile(
			OUTPUT_NORMAL_FILE,
			path.resolve(process.cwd(), "../client/public/normal_data.json"),
		),
	]);
}

if (process.argv[1] === __filename) {
	(async () => {
		info("开始同步数据...");
		await sync();
		await syncCopy();
		info("已完成同步数据...");
	})();
}
