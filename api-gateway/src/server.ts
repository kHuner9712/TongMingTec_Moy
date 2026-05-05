import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.use((_req, res, next) => {
  res.setHeader("X-Powered-By", "MOY API Gateway");
  next();
});

app.get("/", (_req, res) => {
  res.json({
    service: "MOY API Gateway",
    version: "0.1.0",
    status: "running",
    docs: "/docs",
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/v1/models", (_req, res) => {
  res.json({
    models: [
      { id: "gpt-4o", provider: "openai", status: "available" },
      { id: "gpt-4o-mini", provider: "openai", status: "available" },
      { id: "claude-3.5-sonnet", provider: "anthropic", status: "available" },
      { id: "deepseek-chat", provider: "deepseek", status: "available" },
    ],
  });
});

app.post("/v1/chat/completions", (req, res) => {
  const apiKey = req.headers.authorization;
  if (!apiKey) {
    res.status(401).json({ error: { message: "Missing API Key", code: "UNAUTHORIZED" } });
    return;
  }

  res.json({
    id: `chatcmpl-${uuidv4().slice(0,8)}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: req.body.model || "gpt-4o-mini",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: "[MOY API Gateway MVP] 模型调用功能开发中。当前返回占位响应。",
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 20,
      total_tokens: 30,
    },
  });
});

app.get("/v1/keys", (_req, res) => {
  res.json({
    keys: [],
    message: "API Key 管理功能开发中。MVP 阶段通过配置文件管理。",
  });
});

app.get("/v1/usage", (_req, res) => {
  res.json({
    total_tokens: 0,
    total_requests: 0,
    message: "用量统计功能开发中。",
  });
});

app.get("/docs", (_req, res) => {
  res.json({
    title: "MOY API 开发者文档",
    version: "0.1.0",
    sections: [
      { title: "快速开始", path: "/docs/quickstart" },
      { title: "API 参考", path: "/docs/api-reference" },
      { title: "模型列表", path: "/docs/models" },
      { title: "API Key 管理", path: "/docs/api-keys" },
      { title: "用量与限额", path: "/docs/usage" },
    ],
    message: "开发者文档开发中。MVP 阶段通过 OpenAPI/Swagger 交付。",
  });
});

app.listen(PORT, () => {
  console.log(`MOY API Gateway running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API base:    http://localhost:${PORT}/v1`);
});

export default app;
