import { execSync, spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { setTimeout } from "node:timers";

const BASE_URL = process.env.GEO_SMOKE_BASE_URL || "http://localhost:3006";
const BACKEND_PORT = process.env.SMOKE_BACKEND_PORT || "3006";
const WAIT_TIMEOUT_MS = 30000;

const isExternal = !!process.env.GEO_SMOKE_BASE_URL;

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
      const res = await fetch(`${BASE_URL}/api/v1/docs/`, { method: "HEAD" });
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
  log(`目标地址: ${BASE_URL}`);
  log(`模式: ${isExternal ? "远程（跳过本地启动）" : "本地自启动"}`);

  let child = null;

  if (!isExternal) {
    child = startBackend();
  }

  try {
    log("等待后端就绪...");
    await waitForServer();
    log("后端已就绪");

    // Test 1: POST /api/geo/leads 路径正确
    log("Test 1: 验证公开接口路径正确");

    const uniqueSuffix = Date.now().toString(36);
    const body1 = {
      companyName: "MOY GEO Smoke Test Company",
      brandName: "MOY GEO Smoke Test",
      website: "https://smoke-test.example.com",
      industry: "Technology",
      targetCity: "Shenzhen",
      contactName: "Smoke Test User",
      contactMethod: `smoke-test-${uniqueSuffix}`,
      notes: "This is an automated smoke test submission.",
      source: "smoke_test",
    };

    const res1 = await fetchWithTimeout(`${BASE_URL}/api/geo/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body1),
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
      `${BASE_URL}/api/v1/api/geo/leads`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
    );
    if (res2.status !== 404) {
      logError(`Test 2 失败: 期望 404，实际 ${res2.status}（全局前缀排除可能未生效）`);
    } else {
      log("Test 2 通过: /api/v1/api/geo/leads 返回 404");
    }

    // Test 3: CORS
    log("Test 3: 验证 CORS 允许 geo.moy.com");
    const res3 = await fetchWithTimeout(`${BASE_URL}/api/geo/leads`, {
      method: "OPTIONS",
      headers: {
        "Origin": "https://geo.moy.com",
        "Access-Control-Request-Method": "POST",
      },
    });
    const allowOrigin = res3.headers.get("access-control-allow-origin") || "";
    if (!allowOrigin.includes("geo.moy.com") && !allowOrigin.includes("*")) {
      logError(`Test 3 失败: CORS origin 不包含 geo.moy.com, 实际: ${allowOrigin}`);
    } else {
      log(`Test 3 通过: CORS allow origin = ${allowOrigin}`);
    }

    // Test 3b: 也检查 localhost:5176
    log("Test 3b: 验证 CORS 允许 localhost:5176");
    const res3b = await fetchWithTimeout(`${BASE_URL}/api/geo/leads`, {
      method: "OPTIONS",
      headers: {
        "Origin": "http://localhost:5176",
        "Access-Control-Request-Method": "POST",
      },
    });
    const allowOriginB = res3b.headers.get("access-control-allow-origin") || "";
    if (!allowOriginB.includes("5176")) {
      logError(`Test 3b 失败: CORS origin 不包含 5176, 实际: ${allowOriginB}`);
    } else {
      log(`Test 3b 通过: CORS allow origin = ${allowOriginB}`);
    }

    // Test 4: Honeypot 返回假成功
    log("Test 4: 验证 honeypot 返回假成功");
    const res4 = await fetchWithTimeout(`${BASE_URL}/api/geo/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: "MOY GEO Smoke Test Company",
        brandName: "MOY GEO Smoke Test",
        website: "https://smoke-test.example.com",
        industry: "Technology",
        contactName: "Smoke Test Bot",
        contactMethod: `smoke-test-honeypot-${uniqueSuffix}`,
        _hint: "i-am-a-bot",
        source: "smoke_test",
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
    const res5 = await fetchWithTimeout(`${BASE_URL}/api/v1/geo-leads`);
    if (res5.status === 401 || res5.status === 403) {
      log(`Test 5 通过: 管理接口返回 ${res5.status}（需认证）`);
    } else {
      logError(`Test 5 失败: 管理接口未保护，状态码 ${res5.status}`);
    }

    log("======== Smoke Test 全部完成 ========");
  } catch (err) {
    logError(`异常: ${err.message}`);
  } finally {
    if (!isExternal && child) {
      stopBackend(child);
    }
  }
}

run();
