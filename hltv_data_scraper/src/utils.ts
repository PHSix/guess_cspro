import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs/promises";
import {
	OUTPUT_FILE,
	OUTPUT_MODE,
	OUTPUT_NORMAL_FILE,
	OUTPUT_YLG_FILE,
} from "./constants";
import path from "node:path";
puppeteer.use(StealthPlugin());

export function openBrowser() {
	return puppeteer.launch({
		headless: false, // 可视化模式
		args: [
			"--no-sandbox",
			"--disable-setuid-sandbox",
			"--disable-blink-features=AutomationControlled",
		],
		defaultViewport: null,
	});
}

/**
 * 写入数据到文件
 */
export async function writeOutputJsonFile(mode: OUTPUT_MODE, data: any) {
	const filePath = path.resolve(
		process.cwd(),
		mode === OUTPUT_MODE.YLG
			? OUTPUT_YLG_FILE
			: mode === OUTPUT_MODE.NORMAL
				? OUTPUT_NORMAL_FILE
				: OUTPUT_FILE,
	);

	const dir = path.dirname(filePath);

	const exist = await fs.stat(dir).catch(() => null);

	if (!exist) {
		await fs.mkdir(dir);
	}

	info(`已写入数据到文件: ${filePath}`);
	return fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export async function readJsonFile(filePath: string) {
	return fs.readFile(filePath, "utf-8").then((data) => JSON.parse(data));
}

/**
 * 随机延迟
 */
export function randomDelay(min: number = 1000, max: number = 2000) {
	return new Promise((resolve) =>
		setTimeout(resolve, Math.random() * (max - min) + min),
	);
}

/**
 * 获取当前年份
 */
export function getCurrentYear() {
	return new Date().getFullYear();
}

export const error = console.error;
export const info = console.info;
