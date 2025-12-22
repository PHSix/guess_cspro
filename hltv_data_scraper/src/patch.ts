import { OUTPUT_FILE, OUTPUT_MODE } from "./constants";
import { info, readJsonFile, writeOutputJsonFile } from "./utils";
import puppeteerExtra from "puppeteer-extra";
import { fetchPlayer } from "./fetchPlayer";
import { syncCopy } from "./sync";

async function main() {
	const browser = await puppeteerExtra.launch({
		headless: false,
		args: [
			"--no-sandbox",
			"--disable-setuid-sandbox",
			"--disable-blink-features=AutomationControlled",
		],
		defaultViewport: null,
	});

	await fetchPlayer(
		browser,
		[
			/* PLACEHOLDER: to place your players which you want to patch in here */
			{
				id: "Mercury",
				link: "https://www.hltv.org/player/20895/mercury",
			},
			{
				id: "yxngstxr",
				link: "https://www.hltv.org/player/22047/yxngstxr",
			},
			{
				id: "Alkaren",
				link: "https://www.hltv.org/player/23600/alkaren",
			},
		],
		async (players) => {
			const json = await readJsonFile(OUTPUT_FILE).catch(() => ({}));

			for (const player of players) {
				json[player.id] = player;
			}

			info("已更新数据：", players.map((player) => player.id).join(","));

			await writeOutputJsonFile(OUTPUT_MODE.ALL, json);
		},
	);

	info("已完成数据获取，开始同步模式数据...");
	await syncCopy();

	info("已完成同步模式数据...");

	await browser.close();
}

main();
