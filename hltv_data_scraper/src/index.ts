import { INPUT_FILE, OUTPUT_FILE, OUTPUT_MODE } from "./constants";
import { info, readJsonFile, writeOutputJsonFile } from "./utils";
import puppeteerExtra from "puppeteer-extra";
import { fetchPlayer } from "./fetchPlayer";
import { syncCopy } from "./sync";

async function main() {
  const players: Array<{
    id: string;
    link: string;
  }> = await readJsonFile(INPUT_FILE);

  info("开始获取全部数据...");

  info(`共获取到 ${players.length} 个选手初始数据`);

  const browser = await puppeteerExtra.launch({
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
    defaultViewport: null,
  });

  await fetchPlayer(browser, players, async players => {
    const json = await readJsonFile(OUTPUT_FILE).catch(() => ({}));

    for (const player of players) {
      json[player.id] = player;
    }

    info("已更新数据：", players.map(player => player.id).join(","));

    await writeOutputJsonFile(OUTPUT_MODE.ALL, json);
  });

  info("已完成数据获取，开始同步模式数据...");
  await syncCopy();

  info("已完成同步模式数据...");

  await browser.close();
}

main();
