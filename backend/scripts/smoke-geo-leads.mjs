import { execSync, spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { setTimeout } from "node:timers";

const BACKEND_URL = process.env.SMOKE_BACKEND_URL || "http://localhost:3006";
const BACKEND_PORT = process.env.SMOKE_BACKEND_PORT || "3006";
const WAIT_TIMEOUT_MS = 30000;

function log(msg) {
  console.log(`[smoke:geo-leads] ${msg}`);
}

function logError(msg) {
  console.error(`[smoke:geo-leads] FAIL: ${msg}`);
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

async function waitForServer(maxAttempts = 30, intervalMs = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/v1/docs/`, { method: "HEAD" });
      if (res.ok || res.status === 404) return;
    } catch {}
    await sleep(intervalMs);
  }
  throw new Error(`后端未能在 ${maxAttempts * intervalMs / 1000}s 内就绪`);
}

function startBackend() {
  log(`启动后端进程... PORT=${BACKEND_PORT}`);
  const env = {
    ...process.env,
    NODE_ENV: "test",
    PORT: BACKEND_PORT,
    DB_SYNCHRONIZE: "true",
    DB_MIGRATIONS_RUN: "false",
    GEO_LEAD_NOTIFY_WEBHOOK_TYPE: "none",
  };

  const child = spawn("npm", ["run", "start"], {
    stdio: ["ignore", "pipe", "pipe"],
    env,
    shell: true,
    cwd: new URL("..", import.meta.url).pathname,
  });

  child.stdout.on("data", (d) => { /* suppress */ });
  child.stderr.on("data", (d) => { /* suppress */ });

  return child;
}

function stopBackend(child) {
  if (child && child.pid && !child.killed) {
    if (process.platform === "win32") {
      try { execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: "ignore" }); } catch {}
    } else {
      child.kill("SIGTERM");
    }
  }
}

async function run() {
  log("======== MOY GEO Leads Smoke Test ========");

  const child = startBackend();

  try {
    log("等待后端就绪...");
    await waitForServer();
    log("后端已就绪");

    // Test 1: POST /api/geo/leads 路径正确
    log("Test 1: 验证公开接口路径正确");
    const res1 = await fetchWithTimeout(`${BACKEND_URL}/api/geo/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: "Smoke公司",
        brandName: "Smoke品牌",
        website: "https://smoke-test.example.com",
        industry: "互联网",
        targetCity: "深圳",
        contactName: "测试用户",
        contactMethod: "smoke_test_18500000001",
        notes: "smoke test",
        source: "smoke_test",
      }),
    });

    if (res1.status !== 201) {
      logError(`Test 1 失败: 期望 201，实际 ${res1.status}`);
      const text = await res1.text();
      log(`  body: ${text.substring(0, 200)}`);
    } else {
      const data = await res1.json();
      if (!data.id || data.id === "geo_lead_ignored") {
        logError("Test 1 失败: honeypot 误触发或 id 缺失");
      } else {
        log(`Test 1 通过: lead id = ${data.id}, status = ${data.status}`);
      }
    }

    // Test 2: 确保不是 /api/v1/api/geo/leads
    log("Test 2: 验证路径不是 /api/v1/api/geo/leads");
    const res2 = await fetchWithTimeout(
      `${BACKEND_URL}/api/v1/api/geo/leads`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
    );
    if (res2.status !== 404) {
      logError(`Test 2 失败: 期望 404，实际 ${res2.status}（全局前缀排除可能未生效）`);
    } else {
      log("Test 2 通过: /api/v1/api/geo/leads 返回 404");
    }

    // Test 3: CORS
    log("Test 3: 验证 CORS 允许 localhost:5176");
    const res3 = await fetchWithTimeout(`${BACKEND_URL}/api/geo/leads`, {
      method: "OPTIONS",
      headers: {
        "Origin": "http://localhost:5176",
        "Access-Control-Request-Method": "POST",
      },
    });
    const allowOrigin = res3.headers.get("access-control-allow-origin") || "";
    if (!allowOrigin.includes("5176")) {
      logError(`Test 3 失败: CORS origin 不包含 5176, 实际: ${allowOrigin}`);
    } else {
      log(`Test 3 通过: CORS allow origin = ${allowOrigin}`);
    }

    // Test 4: Honeypot 返回假成功
    log("Test 4: 验证 honeypot 返回假成功");
    const res4 = await fetchWithTimeout(`${BACKEND_URL}/api/geo/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: "Bot公司",
        brandName: "Bot品牌",
        website: "https://bot.example.com",
        industry: "互联网",
        contactName: "机器人",
        contactMethod: "bot_18500000002",
        _hint: "i-am-a-bot",
      }),
    });
    const data4 = await res4.json();
    if (data4.id !== "geo_lead_ignored") {
      logError(`Test 4 失败: honeypot 应返回 geo_lead_ignored，实际 ${data4.id}`);
    } else {
      log("Test 4 通过: honeypot 命中返回 geo_lead_ignored");
    }

    // Test 5: 管理接口需要认证
    log("Test 5: 验证管理接口不公开（需要 JWT）");
    const res5 = await fetchWithTimeout(`${BACKEND_URL}/api/v1/geo-leads`);
    if (res5.status === 401 || res5.status === 403) {
      log(`Test 5 通过: 管理接口返回 ${res5.status}（需认证）`);
    } else {
      logError(`Test 5 失败: 管理接口未保护，状态码 ${res5.status}`);
    }

    log("======== Smoke Test 全部完成 ========");
  } catch (err) {
    logError(`异常: ${err.message}`);
  } finally {
    stopBackend(child);
  }
}

run();
