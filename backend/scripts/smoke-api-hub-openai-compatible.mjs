import http from "node:http";
import { createWriteStream } from "node:fs";

const BASE_URL = process.env.API_HUB_SMOKE_BASE_URL || "http://localhost:3001";
const API_KEY = process.env.API_HUB_SMOKE_KEY || "";
const MODEL = process.env.API_HUB_SMOKE_MODEL || "moy-mock-chat";

let passed = 0;
let failed = 0;

function report(label, ok, detail) {
  if (ok) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failed++;
    console.log(`  FAIL  ${label}${detail ? " — " + detail : ""}`);
  }
}

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

async function run() {
  if (!API_KEY) {
    console.log("SKIP: 未设置 API_HUB_SMOKE_KEY 环境变量");
    console.log("请先通过管理接口创建 API Key:");
    console.log("  POST /api/v1/api-hub/projects/{projectId}/keys");
    console.log("然后设置:");
    console.log("  $env:API_HUB_SMOKE_KEY=\"moy_sk_...\"");
    process.exit(0);
  }

  console.log(`Smoke: OpenAI-Compatible Entry MVP`);
  console.log(`Base: ${BASE_URL}`);
  console.log(`Key:  ${API_KEY.substring(0, 12)}...`);
  console.log("");

  // 1. GET /v1/models
  console.log("1. GET /v1/models");
  const m1 = await request("GET", "/v1/models", { auth: API_KEY });
  report("status 200", m1.status === 200, `got ${m1.status}`);
  report("object=list", m1.data?.object === "list", `got ${JSON.stringify(m1.data?.object)}`);
  report("data is array", Array.isArray(m1.data?.data), `type ${typeof m1.data?.data}`);
  console.log("");

  // 2. POST /v1/chat/completions
  console.log("2. POST /v1/chat/completions");
  const m2 = await request("POST", "/v1/chat/completions", {
    body: { model: MODEL, messages: [{ role: "user", content: "Hello MOY" }] },
    auth: API_KEY,
  });
  report("status 200", m2.status === 200, `got ${m2.status}`);
  report("object=chat.completion", m2.data?.object === "chat.completion", `got ${m2.data?.object}`);
  report("choices[0].message.role=assistant", m2.data?.choices?.[0]?.message?.role === "assistant");
  report("usage present", !!m2.data?.usage, `tokens=${m2.data?.usage?.total_tokens}`);
  console.log("");

  // 3. /api/v1/v1/models 不应作为正确路径
  console.log("3. /api/v1/v1/models 不应作为正确路径");
  const m3 = await request("GET", "/api/v1/v1/models", { auth: API_KEY });
  report("not 200", m3.status !== 200, `got ${m3.status} (expected not 200)`);
  console.log("");

  // 4. stream=true 返回错误
  console.log("4. stream=true 返回错误");
  const m4 = await request("POST", "/v1/chat/completions", {
    body: { model: MODEL, messages: [{ role: "user", content: "Hi" }], stream: true },
    auth: API_KEY,
  });
  report("status 400", m4.status === 400, `got ${m4.status}`);
  report("code stream_not_supported", m4.data?.error?.code === "stream_not_supported", `got ${m4.data?.error?.code}`);
  console.log("");

  // 5. invalid key 返回 401
  console.log("5. invalid key 返回 401");
  const m5 = await request("POST", "/v1/chat/completions", {
    body: { model: MODEL, messages: [{ role: "user", content: "Hi" }] },
    auth: "moy_sk_deadbeef00000000000000000000",
  });
  report("status 401", m5.status === 401, `got ${m5.status}`);
  report("error present", !!m5.data?.error);
  console.log("");

  console.log(`Result: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error("Smoke test error:", err.message);
  process.exit(1);
});
