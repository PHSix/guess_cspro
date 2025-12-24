import { Browser } from "puppeteer";
import { getCurrentYear, randomDelay } from "./utils";
// 定义简化后的选手数据结构
interface Player {
  id: string;
  link: string;
}

// 完整的选手数据结构
interface PlayerData {
  id?: string;
  link: string;
  country?: string;
  team?: string;
  birth_year?: number | string;
  role?: string;
  majorsPlayed?: number;
  avatar?: string;
  [key: string]: any;
}

const info = console.info;
const error = console.error;

/**
 * 统一的选手数据获取函数
 * @param browser Puppeteer浏览器实例
 * @param players 选手列表（仅包含id和link）
 *
 * @param save 保存数据的函数
 */
export async function fetchPlayer(
  browser: Browser,
  players: Player[],
  save: (players: PlayerData[]) => Promise<void> | void
) {
  const page = await browser.newPage();
  let playerBuffer: PlayerData[] = [];

  for (let i = 0; i < players.length; i++) {
    const player = players[i];
    const idx = i + 1;

    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        info(
          `正在获取选手 ${player.id} 的详细信息 (${idx}/${players.length})...`
        );

        // ===== 第一步：获取基础信息 (country, team, birth_year, role) =====
        await page.goto(player.link, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });

        // 1. 获取国籍
        let country = "Unknown";
        try {
          await page.waitForSelector("div.playerRealname img.flag", {
            timeout: 5000,
          });
          country = await page.$eval(
            "div.playerRealname img.flag",
            el => el.getAttribute("alt")?.trim() || "Unknown"
          );
        } catch (e) {
          error(`未找到选手 ${player.id} 的国籍信息`);
        }

        // 2. 获取队伍
        let team = "No team";
        try {
          const selector =
            "div.playerTeam span.listRight span[itemprop='text'],a[itemprop='text']";
          await page.waitForSelector(selector, { timeout: 2000 });
          team = await page.$eval(
            selector,
            el => (el.innerText || el.textContent)?.trim() || "No team"
          );
        } catch (e) {
          error(`未找到选手 ${player.id} 的队伍信息`);
        }

        // 3. 获取年龄并计算出生年份
        let birthYear: number | string = "Unknown";
        try {
          await page.waitForSelector(
            "div.playerAge span.listRight span[itemprop='text']",
            { timeout: 2000 }
          );
          const ageText = await page.$eval(
            "div.playerAge span.listRight span[itemprop='text']",
            el => el.textContent?.trim() || ""
          );
          const age = parseInt(ageText.split(" ")[0]);
          if (!isNaN(age)) {
            birthYear = getCurrentYear() - age;
          }
        } catch (e) {
          error(`未找到选手 ${player.id} 的年龄信息`);
        }

        // 4. 获取角色 (Role)
        let role = "Unknown";
        try {
          const snipingScore = await page.evaluate(
            body => {
              const statDivs = body.querySelectorAll(".player-stat");
              for (const div of statDivs) {
                const title = div.querySelector("b");
                if (title && title.textContent === "Sniping") {
                  const valSpan = div.querySelector(".statsVal b");
                  return valSpan ? parseInt(valSpan.textContent || "0") : null;
                }
              }
              return null;
            },
            await page.$("body")
          );

          if (snipingScore !== null) {
            role = snipingScore > 60 ? "AWPer" : "Rifler";
          } else {
            throw new Error("Main page sniping stat not found");
          }
        } catch (e) {
          error(`主页未找到 Sniping 数据，尝试从 stats 页面获取...`);
          try {
            const statsUrl = player.link.replace("/player/", "/stats/players/");
            await page.goto(statsUrl, { waitUntil: "domcontentloaded" });

            await page.waitForSelector(
              "div.role-stats-section.role-sniping div.row-stats-section-score",
              { timeout: 5000 }
            );
            const statsText = await page.$eval(
              "div.role-stats-section.role-sniping div.row-stats-section-score",
              el => el.textContent?.trim() || ""
            );

            const snipingScore = parseInt(statsText.split("/")[0]);
            if (!isNaN(snipingScore)) {
              role = snipingScore > 60 ? "AWPer" : "Rifler";
              info(`从 stats 页面获取到 Sniping 数据: ${snipingScore}`);
            }
          } catch (innerE) {
            error(`在 stats 页面也未找到选手 ${player.id} 的 Sniping 数据`);
          }
        }

        // 5. 获取avatar
        let avatar = null;
        try {
          await page.waitForSelector(".playerContainer", { timeout: 2000 });
          avatar = await page
            .$eval(".bodyshot-img", el => el.src)
            .catch(() => page.$eval(".profile-img", el => el.src));
        } catch (e) {
          error(`未找到选手 ${player.id} 的头像`);
        }

        // ===== 第二步：获取Major参赛次数 =====
        let majorsPlayed = 0;
        try {
          await page.goto(`${player.link}#tab-achievementBox`, {
            waitUntil: "domcontentloaded",
          });

          majorsPlayed = await page.evaluate(
            body => {
              const statCards = Array.from(
                body.querySelectorAll(".highlighted-stat")
              );

              const majorCard: any = statCards.find(
                (card: any) =>
                  // HLTV 可能会有两个名字，一个是 Majors played，一个是 Major played
                  card.textContent?.includes("Majors played") ||
                  card.textContent?.includes("Major played")
              );

              if (majorCard) {
                const statValue = majorCard.querySelector(".stat")?.textContent;
                if (statValue) {
                  return parseInt(statValue);
                }
              }

              return 0;
            },
            await page.$("body")
          );

          info(`获取到 ${player.id} 的 Major 次数: ${majorsPlayed}`);
        } catch (e) {
          error(`未找到选手 ${player.id} 的 Major 数据，设为 0`);
          majorsPlayed = 0;
        }

        // 插入数据到缓存，等候命flush保存
        playerBuffer.push({
          id: player.id,
          link: player.link,
          country,
          team,
          birth_year: birthYear,
          role,
          majorsPlayed: majorsPlayed,
          avatar,
        });

        info(
          `已更新: ${player.id} | 国籍: ${country} | 队: ${team} | 年: ${birthYear} | 角: ${role} | Major: ${majorsPlayed}`
        );

        await randomDelay();
        break; // 成功，跳出重试循环
      } catch (err) {
        retries++;
        error(`获取选手 ${player.id} 出错: ${err}`);
        if (retries < maxRetries) {
          const waitTime = retries * 5000;
          error(`等待 ${waitTime / 1000} 秒后重试...`);
          await new Promise(r => setTimeout(r, waitTime));
        } else {
          error(`跳过选手 ${player.id} (达最大重试次数)`);
          // TODO: 保存错误状态
        }
      }
    }

    // 每5个选手保存一次（示例逻辑）
    if (idx % 5 === 0) {
      // flush批量保存
      await save(playerBuffer);
      playerBuffer = [];
    }
  }

  /// 最后如果有剩余的数据，则再保存
  if (playerBuffer.length > 0) {
    await save(playerBuffer);
  }

  await page.close();
}
