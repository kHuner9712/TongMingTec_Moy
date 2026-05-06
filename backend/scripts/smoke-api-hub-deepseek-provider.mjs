import http from "node:http";

const BASE_URL = process.env.API_HUB_SMOKE_BASE_URL || "http://localhost:3001";
const API_KEY = process.env.API_HUB_SMOKE_KEY || "";
const MODEL = process.env.API_HUB_SMOKE_MODEL || "moy-deepseek-chat";
const EXPECT_REAL = (process.env.API_HUB_EXPECT_REAL_PROVIDER || "true") !== "false";

let passed = 0;
let failed = 0;

function report(label, ok, detail) {
  if (ok) { passed++; console.log(`  PASS  ${label}`); }
  else { failed++; console.log(`  FAIL  ${label}${detail ? " — " + detail : ""}`); }
}

function info(msg) { console.log(`  INFO  ${msg}`); }

function request(method, path, { body, auth } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { "content-type": "application/json" },
    };
    if (auth) opts.headers["authorization"] = `Bearer ${auth}`;
    const req = http.request(opts, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        let data;
        try { data = JSON.parse(Buffer.concat(chunks).toString()); } catch { data = Buffer.concat(chunks).toString(); }
        resolve({ status: res.statusCode, headers: res.headers, data });
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function isMockResponse(data) {
  const content = data?.choices?.[0]?.message?.content || "";
  return content.includes("mock response") || content.includes("This is a mock");
}

async function run() {
  if (!API_KEY) {
    console.log("SKIP: 未设置 API_HUB_SMOKE_KEY 环境变量");
    console.log("");
    console.log("请先运行 seed 脚本初始化 DeepSeek 测试链路：");
    console.log("");
    console.log("  $env:API_HUB_SEED_JWT=\"eyJhbGci...\"");
    console.log("  npm run seed:api-hub:deepseek");
    console.log("");
    console.log("或手动设置已有 API Key：");
    console.log('  $env:API_HUB_SMOKE_KEY="moy_sk_..."');
    process.exit(0);
  }

  console.log(`Smoke: DeepSeek Provider Proxy`);
  console.log(`Base:         ${BASE_URL}`);
  console.log(`Key:          ${API_KEY.substring(0, 12)}...`);
  console.log(`Model:        ${MODEL}`);
  console.log(`Expect Real:  ${EXPECT_REAL}`);
  console.log("");

  // 1. GET /v1/models
  console.log("1. GET /v1/models");
  const m1 = await request("GET", "/v1/models", { auth: API_KEY });
  report("status 200", m1.status === 200, `got ${m1.status}`);
  report("object=list", m1.data?.object === "list");
  if (m1.data?.data) {
    const found = m1.data.data.find(m => m.id === MODEL);
    report(`model "${MODEL}" in list`, !!found, found ? `owned_by=${found.owned_by}` : "not found");
  }
  console.log("");

  // 2. POST /v1/chat/completions → DeepSeek provider
  console.log("2. POST /v1/chat/completions → DeepSeek provider");
  const m2 = await request("POST", "/v1/chat/completions", {
    body: { model: MODEL, messages: [{ role: "user", content: "你是谁？" }] },
    auth: API_KEY,
  });

  if (m2.status === 502) {
    const code = m2.data?.error?.code;
    if (code === "provider_api_key_missing") {
      info("后端缺少 DEEPSEEK_API_KEY，请在 backend 环境变量中配置");
      console.log("  该错误是预期行为 — 不是 API Key 鉴权失败，而是 provider 密钥未配置。");
      console.log("");
      console.log(`Result: ${passed} passed, ${failed} failed (provider key expectedly missing)`);
      process.exit(0);
    }
    if (code === "provider_not_configured") {
      info("Provider Config 未配置或已停用，请运行 seed 脚本初始化。");
      console.log("");
      console.log(`Result: ${passed} passed, ${failed} failed`);
      process.exit(1);
    }
  }

  report("status 200", m2.status === 200, `got ${m2.status}`);
  report("object=chat.completion", m2.data?.object === "chat.completion", `got ${m2.data?.object}`);
  report("choices[0].message.role=assistant", m2.data?.choices?.[0]?.message?.role === "assistant");

  if (EXPECT_REAL && isMockResponse(m2.data)) {
    report("not mock response", false, "期望真实 DeepSeek provider 响应，但收到 mock response");
  } else {
    report("response received", !!m2.data?.choices?.[0]?.message?.content);
  }

  report("usage present", !!m2.data?.usage);
  if (m2.data?.usage) {
    info(`usage: prompt=${m2.data.usage.prompt_tokens} completion=${m2.data.usage.completion_tokens} total=${m2.data.usage.total_tokens}`);
  }
  if (m2.data?.id) info(`completion id: ${m2.data.id}`);
  if (m2.data?.model) info(`model field: ${m2.data.model}`);
  if (!isMockResponse(m2.data)) info("provider: 真实 DeepSeek");

  console.log("");

  // 3. stream=true 返回 400
  console.log("3. stream=true 返回 400");
  const m3 = await request("POST", "/v1/chat/completions", {
    body: { model: MODEL, messages: [{ role: "user", content: "Hi" }], stream: true },
    auth: API_KEY,
  });
  report("status 400", m3.status === 400, `got ${m3.status}`);
  report("code stream_not_supported", m3.data?.error?.code === "stream_not_supported", `got ${m3.data?.error?.code}`);
  console.log("");

  // 4. mock model still accessible for comparison
  console.log("4. mock model (moy-mock-chat) still works");
  const m4 = await request("POST", "/v1/chat/completions", {
    body: { model: "moy-mock-chat", messages: [{ role: "user", content: "Hello" }] },
    auth: API_KEY,
  });
  report("status 200 or 403", [200, 403].includes(m4.status), `got ${m4.status}`);
  if (m4.status === 200) {
    report("mock response", isMockResponse(m4.data));
  } else {
    info("moy-mock-chat 未在此 project 启用，预期行为");
  }
  console.log("");

  console.log(`Result: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error("Smoke test error:", err.message);
  process.exit(1);
});
