import http from "node:http";

const BASE_URL = process.env.API_HUB_SMOKE_BASE_URL || "http://localhost:3001";
const API_KEY = process.env.API_HUB_SMOKE_KEY || "";
const MODEL = process.env.API_HUB_SMOKE_MODEL || "moy-deepseek-v3";

let passed = 0;
let failed = 0;

function report(label, ok, detail) {
  if (ok) { passed++; console.log(`  PASS  ${label}`); }
  else { failed++; console.log(`  FAIL  ${label}${detail ? " — " + detail : ""}`); }
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
    process.exit(0);
  }

  console.log(`Smoke: DeepSeek Provider Proxy`);
  console.log(`Base: ${BASE_URL}`);
  console.log(`Key:  ${API_KEY.substring(0, 12)}...`);
  console.log(`Model: ${MODEL}`);
  console.log("");

  console.log("1. GET /v1/models");
  const m1 = await request("GET", "/v1/models", { auth: API_KEY });
  report("status 200", m1.status === 200, `got ${m1.status}`);
  report("object=list", m1.data?.object === "list");
  console.log("");

  console.log("2. POST /v1/chat/completions → DeepSeek provider");
  const m2 = await request("POST", "/v1/chat/completions", {
    body: { model: MODEL, messages: [{ role: "user", content: "你是谁？" }] },
    auth: API_KEY,
  });
  report("status 200", m2.status === 200, `got ${m2.status}`);
  report("object=chat.completion", m2.data?.object === "chat.completion", `got ${m2.data?.object}`);
  report("choices[0].message.role=assistant", m2.data?.choices?.[0]?.message?.role === "assistant");
  report("usage present", !!m2.data?.usage, `tokens=${m2.data?.usage?.total_tokens}`);
  console.log("");

  console.log("3. mock model still works (moy-mock-chat)");
  const m3 = await request("POST", "/v1/chat/completions", {
    body: { model: "moy-mock-chat", messages: [{ role: "user", content: "Hello" }] },
    auth: API_KEY,
  });
  report("status 200", m3.status === 200, `got ${m3.status}`);
  report("mock response", m3.data?.choices?.[0]?.message?.content?.includes("mock response"));
  console.log("");

  console.log("4. provider error simulation");
  const m4 = await request("POST", "/v1/chat/completions", {
    body: { model: "moy-unknown-provider", messages: [{ role: "user", content: "Hi" }] },
    auth: API_KEY,
  });
  report("not 200", m4.status !== 200, `got ${m4.status} (expected error)`);
  console.log("");

  console.log(`Result: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error("Smoke test error:", err.message);
  process.exit(1);
});
