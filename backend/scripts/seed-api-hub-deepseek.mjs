import { request } from "./utils/http-request.mjs";

const BASE_URL = process.env.API_HUB_SEED_BASE_URL || "http://localhost:3001";
const JWT = process.env.API_HUB_SEED_JWT || "";

const PROVIDER = process.env.API_HUB_SEED_PROVIDER || "deepseek";
const PROVIDER_BASE_URL = process.env.API_HUB_SEED_PROVIDER_BASE_URL || "https://api.deepseek.com";
const PROVIDER_ENV_NAME = process.env.API_HUB_SEED_PROVIDER_ENV_NAME || "DEEPSEEK_API_KEY";
const MODEL_ID = process.env.API_HUB_SEED_MODEL_ID || "moy-deepseek-chat";
const UPSTREAM_MODEL = process.env.API_HUB_SEED_UPSTREAM_MODEL || "deepseek-chat";
const QUOTA_LIMIT = +(process.env.API_HUB_SEED_QUOTA_LIMIT || "100000");

const ADMIN_PREFIX = "/api/v1/api-hub";

function ok(status) { return status >= 200 && status < 300; }

function handle409(res, label) {
  if (res.status === 409) {
    console.log(`  [已存在] ${label}，跳过创建`);
    return true;
  }
  return false;
}

async function run() {
  if (!JWT) {
    console.log("❌ 缺少 API_HUB_SEED_JWT 环境变量");
    console.log("");
    console.log("请先登录 MOY App 并获取 JWT token，然后设置：");
    console.log('  $env:API_HUB_SEED_JWT="eyJhbGciOi..."');
    console.log("");
    console.log("或从 Developer Console (http://localhost:5177/console) 顶部粘贴已登录的 token。");
    process.exit(1);
  }

  console.log("MOY API Hub — DeepSeek 测试链路初始化");
  console.log("=".repeat(50));
  console.log(`Base:       ${BASE_URL}`);
  console.log(`Provider:   ${PROVIDER}`);
  console.log(`Model:      ${MODEL_ID}`);
  console.log(`Upstream:   ${UPSTREAM_MODEL}`);
  console.log(`Quota:      ${QUOTA_LIMIT}`);
  console.log("");

  const currentMonth = new Date().toISOString().substring(0, 7);
  let providerConfigId, projectId, modelId, createdKey;

  // 1. Provider Config
  console.log("1/6 创建 Provider Config ...");
  let pc = await request("POST", BASE_URL, `${ADMIN_PREFIX}/provider-configs`, {
    auth: JWT,
    body: {
      provider: PROVIDER,
      displayName: "DeepSeek",
      baseUrl: PROVIDER_BASE_URL,
      apiKeyEnvName: PROVIDER_ENV_NAME,
      timeoutMs: 60000,
    },
  });
  if (ok(pc.status)) {
    providerConfigId = pc.data?.id;
    console.log(`  ✓ Provider Config 已创建 (${pc.data?.displayName}, status=${pc.data?.status})`);
  } else if (pc.status === 409) {
    console.log("  [已存在] Provider Config，尝试获取...");
    pc = await request("GET", BASE_URL, `${ADMIN_PREFIX}/provider-configs/${PROVIDER}`, { auth: JWT });
    if (ok(pc.status)) { providerConfigId = pc.data?.id; console.log(`  ✓ 已存在: ${pc.data?.displayName}, status=${pc.data?.status}`); }
    else { console.log(`  ⚠ 获取失败: ${pc.status}`); }
  } else {
    console.log(`  ✗ 失败: ${pc.status} — ${JSON.stringify(pc.data)}`);
  }

  // 2. Project
  console.log("2/6 创建 API Project ...");
  let pj = await request("POST", BASE_URL, `${ADMIN_PREFIX}/projects`, {
    auth: JWT,
    body: { name: "MOY API DeepSeek Smoke Project", description: "DeepSeek provider 本地测试项目" },
  });
  if (ok(pj.status)) {
    projectId = pj.data?.id;
    console.log(`  ✓ Project 已创建 (${pj.data?.name}, id=${projectId?.substring(0, 8)}...)`);
  } else if (pj.status === 409) {
    console.log("  [尝试] 查找已有 project ...");
    const listRes = await request("GET", BASE_URL, `${ADMIN_PREFIX}/projects`, { auth: JWT });
    if (ok(listRes.status)) {
      const projects = Array.isArray(listRes.data) ? listRes.data : (listRes.data?.data || []);
      const existing = projects.find(p => p.name === "MOY API DeepSeek Smoke Project");
      if (existing) { projectId = existing.id; console.log(`  ✓ 已有: ${existing.name}, id=${projectId?.substring(0, 8)}...`); }
      else { console.log("  ✗ 未找到已有 project"); }
    } else { console.log(`  ✗ 查找失败: ${listRes.status}`); }
  } else {
    console.log(`  ✗ 失败: ${pj.status} — ${JSON.stringify(pj.data)}`);
  }
  if (!projectId) { console.log("❌ 未能创建/获取 Project，终止。"); process.exit(1); }

  // 3. Model
  console.log("3/6 创建 ApiModel ...");
  let md = await request("POST", BASE_URL, `${ADMIN_PREFIX}/models`, {
    auth: JWT,
    body: {
      name: "DeepSeek Chat",
      modelId: MODEL_ID,
      provider: PROVIDER,
      upstreamModel: UPSTREAM_MODEL,
      status: "public",
      category: "text",
    },
  });
  if (ok(md.status)) {
    modelId = md.data?.id;
    console.log(`  ✓ Model 已创建 (${md.data?.name}, id=${modelId?.substring(0, 8)}...)`);
  } else if (md.status === 409) {
    console.log("  [尝试] 查找已有 model ...");
    const listRes = await request("GET", BASE_URL, `${ADMIN_PREFIX}/models`, { auth: JWT });
    if (ok(listRes.status)) {
      const models = Array.isArray(listRes.data) ? listRes.data : (listRes.data?.data || []);
      const existing = models.find(m => m.modelId === MODEL_ID || m.name === "DeepSeek Chat");
      if (existing) { modelId = existing.id; console.log(`  ✓ 已有: ${existing.name}, modelId=${existing.modelId}`); }
      else { console.log("  ✗ 未找到已有 model"); }
    } else { console.log(`  ✗ 查找失败: ${listRes.status}`); }
  } else {
    console.log(`  ✗ 失败: ${md.status} — ${JSON.stringify(md.data)}`);
  }
  if (!modelId) { console.log("❌ 未能创建/获取 Model，终止。"); process.exit(1); }

  // 4. Enable Model to Project
  console.log("4/6 将 Model 启用到 Project ...");
  const pm = await request("POST", BASE_URL, `${ADMIN_PREFIX}/projects/${projectId}/models`, {
    auth: JWT,
    body: { modelId: modelId, enabled: true },
  });
  if (ok(pm.status)) {
    console.log(`  ✓ Model 已启用 (${MODEL_ID})`);
  } else if (pm.status === 409) {
    console.log("  [已存在] Model 已启用");
  } else {
    console.log(`  ✗ 失败: ${pm.status} — ${JSON.stringify(pm.data)}`);
  }

  // 5. Quota
  console.log(`5/6 配置当月额度 (${currentMonth}, limit=${QUOTA_LIMIT}) ...`);
  try {
    const q = await request("POST", BASE_URL, `${ADMIN_PREFIX}/projects/${projectId}/quota`, {
      auth: JWT,
      body: { modelId: modelId, quotaLimit: QUOTA_LIMIT, quotaUnit: "token", period: currentMonth },
    });
    if (ok(q.status)) {
      console.log(`  ✓ Quota 已配置 (${QUOTA_LIMIT} tokens/月)`);
    } else if (q.status === 409) {
      console.log("  [已存在] Quota 配置");
    } else {
      console.log(`  ⚠ ${q.status} — ${JSON.stringify(q.data)}`);
    }
  } catch (e) {
    console.log(`  ⚠ 配置失败: ${e.message}`);
  }

  // 6. API Key
  console.log("6/6 创建 API Key ...");
  const k = await request("POST", BASE_URL, `${ADMIN_PREFIX}/projects/${projectId}/keys`, {
    auth: JWT,
    body: { name: "MOY DeepSeek Smoke Key" },
  });
  if (ok(k.status)) {
    createdKey = k.data?.key || k.data?.plainKey || "";
    if (createdKey) {
      console.log(`  ✓ API Key 已创建`);
      console.log("");
      console.log("=".repeat(50));
      console.log("API Key (仅此一次可见，请妥善保存):");
      console.log(`  ${createdKey}`);
      console.log("=".repeat(50));
    } else {
      console.log(`  ⚠ Key 创建成功但未返回明文 key`);
      console.log(`  response: ${JSON.stringify(k.data)}`);
    }
  } else {
    console.log(`  ✗ 失败: ${k.status} — ${JSON.stringify(k.data)}`);
  }

  console.log("");
  console.log("初始化完成！");
  console.log("");

  if (createdKey) {
    console.log("下一步 → 运行 Smoke Test:");
    console.log("");
    console.log(`  $env:API_HUB_SMOKE_BASE_URL="${BASE_URL}"`);
    console.log(`  $env:API_HUB_SMOKE_KEY="${createdKey}"`);
    console.log(`  $env:API_HUB_SMOKE_MODEL="${MODEL_ID}"`);
    console.log(`  npm run test:smoke:api-hub-deepseek`);
    console.log("");
    console.log("注意：确保 backend 环境变量中已配置 DEEPSEEK_API_KEY。");
  }
}

run().catch((err) => {
  console.error("Seed 脚本错误:", err.message);
  process.exit(1);
});
