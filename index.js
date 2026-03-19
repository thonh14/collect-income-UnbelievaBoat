// ============================================================
// Discord Collect Income Bot
// Tự động gửi lệnh /collect-income qua bot UnbelievaBoat
// Bot: https://unbelievaboat.com/
// ============================================================

const { Client } = require("discord.js-selfbot-v13");
const chalk = require("chalk");
const fs = require("fs");
const { CONFIG } = require("./config");

// ============================================================
// UTILS
// ============================================================

function log(account, message, type = "info") {
  const time = new Date().toLocaleTimeString("vi-VN", { hour12: false });
  const label = account ? `[${String(account).slice(0, 22)}]` : "[SYSTEM]";
  const prefix = `${chalk.gray(time)} ${chalk.cyan(label)}`;

  switch (type) {
    case "success":
      console.log(`${prefix} ${chalk.green("✔")} ${message}`);
      break;
    case "error":
      console.log(`${prefix} ${chalk.red("✘")} ${message}`);
      break;
    case "warn":
      console.log(`${prefix} ${chalk.yellow("⚠")} ${message}`);
      break;
    default:
      console.log(`${prefix} ${chalk.white("→")} ${message}`);
  }
}

function randomDelay(minSec, maxSec) {
  const ms = (Math.floor(Math.random() * (maxSec - minSec + 1)) + minSec) * 1000;
  return ms;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatDuration(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h}h ${m}m ${s}s`;
}

// ============================================================
// PARSE LEADERBOARD
// ============================================================

async function parseTopCashUser(client, botAppId) {
  return new Promise((resolve) => {
    const listener = (message) => {
      if (message.author.id === botAppId && message.embeds.length > 0) {
        const embed = message.embeds[0];
        if (embed.fields && embed.fields.length > 0) {
          const topField = embed.fields[0].value;  // "1. <@user_id> - $amount"
          const userMatch = topField.match(/<@(\d+)>/);
          if (userMatch) {
            const userId = userMatch[1];
            const amountMatch = topField.match(/\$(\d+)/);
            const amount = amountMatch ? parseInt(amountMatch[1]) : 0;
            resolve({ userId, amount });
            client.removeListener('messageCreate', listener);
            return;
          }
        }
      }
    };
    client.on('messageCreate', listener);
    setTimeout(() => {
      client.removeListener('messageCreate', listener);
      resolve(null);  // Timeout, không tìm thấy
    }, 10000);
  });
}

// ============================================================
// PARSE ROBBER BALANCE
// ============================================================

async function parseRobberBalance(client, botAppId) {
  return new Promise((resolve) => {
    const listener = (message) => {
      if (message.author.id === botAppId && message.embeds.length > 0) {
        const embed = message.embeds[0];
        const cashField = embed.fields.find(f => f.name.toLowerCase().includes('wallet') || f.name.toLowerCase().includes('cash'));
        if (cashField) {
          const cash = parseInt(cashField.value.replace(/[^\d]/g, ''));
          resolve(cash);
          client.removeListener('messageCreate', listener);
        }
      }
    };
    client.on('messageCreate', listener);
    setTimeout(() => {
      client.removeListener('messageCreate', listener);
      resolve(0);
    }, 10000);
  });
}

// ============================================================
// LOAD TOKENS
// ============================================================

function loadTokens() {
  const filePath = "tokens.txt";

  if (!fs.existsSync(filePath)) {
    console.log(chalk.red("❌ File tokens.txt không tồn tại! Tạo file và thêm Discord token vào."));
    process.exit(1);
  }

  const lines = fs
    .readFileSync(filePath, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && !l.startsWith("//"));

  if (lines.length === 0) {
    console.log(chalk.red("❌ tokens.txt rỗng! Thêm Discord token vào file."));
    process.exit(1);
  }

  log(null, `Đã tải ${chalk.bold(lines.length)} token(s) từ tokens.txt`, "success");
  return lines;
}

// ============================================================
// COLLECT INCOME - 1 TÀI KHOẢN
// ============================================================

async function collectIncome(token, index) {
  const tokenLabel = `Token-${index + 1}`;

  return new Promise((resolve) => {
    const client = new Client({ checkUpdate: false });
    let done = false;

    const finish = () => {
      if (!done) {
        done = true;
        try { client.destroy(); } catch (_) {}
        resolve();
      }
    };

    // Safety timeout: bỏ qua tài khoản nếu quá lâu không phản hồi
    const timeout = setTimeout(() => {
      log(tokenLabel, `Timeout sau ${CONFIG.ACCOUNT_TIMEOUT}s! Bỏ qua.`, "warn");
      finish();
    }, CONFIG.ACCOUNT_TIMEOUT * 1000);

    client.on("ready", async () => {
      const username = client.user.tag || client.user.username;
      log(username, `Đã đăng nhập. Đang gửi /collect-income...`);

      try {
        const channel = await client.channels.fetch(CONFIG.CHANNEL_ID);

        if (!channel) {
          log(username, `Không tìm thấy channel: ${CONFIG.CHANNEL_ID}`, "error");
          clearTimeout(timeout);
          finish();
          return;
        }

        if (!channel.isText || (!channel.isText() && channel.type !== "GUILD_TEXT")) {
          log(username, `Channel không phải text channel!`, "error");
          clearTimeout(timeout);
          finish();
          return;
        }

        await channel.sendSlash(CONFIG.UNBELIEVA_APP_ID, "collect-income");
        log(username, `Đã gửi /collect-income thành công!`, "success");

        // Chờ bot phản hồi
        await sleep(CONFIG.WAIT_AFTER_SEND * 1000);

        // Gửi lệnh deposit all
        await channel.sendSlash(CONFIG.UNBELIEVA_APP_ID, "deposit", [{ type: 3, name: "amount", value: "all" }]);
        log(username, `Đã gửi /deposit all thành công!`, "success");

        // Chờ bot phản hồi deposit
        await sleep(CONFIG.WAIT_AFTER_SEND * 1000);

        // Rob/Crime logic
        if (CONFIG.ENABLE_ROB) {
          // Gửi /balance để lấy cash của robber
          await channel.sendSlash(CONFIG.UNBELIEVA_APP_ID, "balance");
          const robberCash = await parseRobberBalance(client, CONFIG.UNBELIEVA_APP_ID);
          log(username, `Robber cash: $${robberCash}`, "info");

          // Gửi /leaderboard -cash
          await channel.sendSlash(CONFIG.UNBELIEVA_APP_ID, "leaderboard", [
            { type: 3, name: "type", value: "-cash" }
          ]);
          log(username, `Đã gửi /leaderboard -cash`, "info");

          // Parse top user
          const topUser = await parseTopCashUser(client, CONFIG.UNBELIEVA_APP_ID);
          if (topUser && topUser.amount > 0) {
            // Tính tỷ lệ ước tính
            const successRate = Math.min(90, Math.max(10, 50 + (robberCash / topUser.amount - 1) * 25));
            if (successRate > CONFIG.MIN_SUCCESS_RATE) {  // Threshold tùy chỉnh
              await sleep(CONFIG.WAIT_AFTER_LEADERBOARD * 1000);

              // Gửi /rob <user_id>
              await channel.sendSlash(CONFIG.UNBELIEVA_APP_ID, "rob", [
                { type: 6, name: "user", value: topUser.userId }
              ]);
              log(username, `Đã rob user ${topUser.userId} (tỷ lệ: ${successRate.toFixed(1)}%)`, "success");

              await sleep(CONFIG.WAIT_AFTER_ROB_CRIME * 1000);
            } else {
              log(username, `Bỏ qua rob: tỷ lệ thấp (${successRate.toFixed(1)}%)`, "warn");
            }
          } else {
            log(username, `Không tìm thấy top user hoặc họ không có cash`, "warn");
          }
        }

        if (CONFIG.ENABLE_CRIME) {
          // Gửi /crime
          await channel.sendSlash(CONFIG.UNBELIEVA_APP_ID, "crime");
          log(username, `Đã gửi /crime`, "info");

          await sleep(CONFIG.WAIT_AFTER_ROB_CRIME * 1000);
        }
      } catch (e) {
        log(username, `Lỗi: ${e.message}`, "error");
      }

      clearTimeout(timeout);
      finish();
    });

    client.on("error", (e) => {
      log(tokenLabel, `Client error: ${e.message}`, "error");
      clearTimeout(timeout);
      finish();
    });

    client.login(token).catch((e) => {
      log(tokenLabel, `Đăng nhập thất bại: ${e.message}`, "error");
      clearTimeout(timeout);
      finish();
    });
  });
}

// ============================================================
// CHẠY TẤT CẢ TÀI KHOẢN
// ============================================================

async function runAllAccounts(tokens) {
  log(null, `Bắt đầu xử lý ${chalk.bold(tokens.length)} tài khoản...`);

  let success = 0;
  let fail = 0;

  for (let i = 0; i < tokens.length; i++) {
    await collectIncome(tokens[i], i);
    success++;

    // Delay giữa các tài khoản (trừ tài khoản cuối)
    if (i < tokens.length - 1) {
      const delayMs = randomDelay(
        CONFIG.DELAY_BETWEEN_ACCOUNTS_MIN,
        CONFIG.DELAY_BETWEEN_ACCOUNTS_MAX
      );
      log(null, `Chờ ${(delayMs / 1000).toFixed(1)}s trước tài khoản ${i + 2}...`);
      await sleep(delayMs);
    }
  }

  log(null, `Xử lý xong: ${chalk.green(success + " thành công")}`, "success");
}

// ============================================================
// MAIN - LOOP VÔ HẠN
// ============================================================

async function main() {
  console.log(chalk.cyan("╔══════════════════════════════════════════════════╗"));
  console.log(chalk.cyan("║      Discord Collect Income Bot v1.0.0           ║"));
  console.log(chalk.cyan("║   UnbelievaBoat /collect-income Auto-Claimer     ║"));
  console.log(chalk.cyan("╚══════════════════════════════════════════════════╝"));
  console.log();

  const tokens = loadTokens();

  log(null, `Channel ID    : ${chalk.yellow(CONFIG.CHANNEL_ID)}`);
  log(null, `Interval      : ${chalk.yellow(CONFIG.BASE_INTERVAL_HOURS + "h")} + random ${chalk.yellow(CONFIG.RANDOM_EXTRA_MIN_MINUTES + "-" + CONFIG.RANDOM_EXTRA_MAX_MINUTES + " phút")}`);
  log(null, `Delay/account : ${chalk.yellow(CONFIG.DELAY_BETWEEN_ACCOUNTS_MIN + "-" + CONFIG.DELAY_BETWEEN_ACCOUNTS_MAX + "s")}`);
  console.log();

  let cycle = 1;

  while (true) {
    const cycleStart = new Date().toLocaleString("vi-VN");
    log(null, chalk.bold(`━━━ BẮT ĐẦU CYCLE #${cycle} | ${cycleStart} ━━━`));

    await runAllAccounts(tokens);

    // Tính thời gian chờ cho cycle tiếp theo
    const baseMs = CONFIG.BASE_INTERVAL_HOURS * 3600 * 1000;
    const extraMs = randomDelay(
      CONFIG.RANDOM_EXTRA_MIN_MINUTES * 60,
      CONFIG.RANDOM_EXTRA_MAX_MINUTES * 60
    );
    const totalMs = baseMs + extraMs;
    const nextRunTime = new Date(Date.now() + totalMs).toLocaleString("vi-VN");

    log(
      null,
      `Cycle #${cycle} xong. Nghỉ ${chalk.yellow(formatDuration(totalMs))} → Lần tiếp: ${chalk.cyan(nextRunTime)}`,
      "success"
    );
    console.log();

    await sleep(totalMs);
    cycle++;
  }
}

main().catch((e) => {
  console.error(chalk.red(`\n❌ Lỗi nghiêm trọng: ${e.message}`));
  process.exit(1);
});
