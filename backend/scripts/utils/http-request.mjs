import http from "node:http";
import https from "node:https";

/**
 * 通用 HTTP/HTTPS 请求 helper
 * @param {"GET"|"POST"|"PATCH"|"DELETE"} method
 * @param {string} baseUrl - http(s)://host:port
 * @param {string} path - 绝对路径或相对路径
 * @param {{ body?: object, auth?: string, headers?: object, timeoutMs?: number }} options
 * @returns {Promise<{ status: number, headers: object, data: any }>}
 */
export function request(method, baseUrl, path, options = {}) {
  const { body, auth, headers: extraHeaders = {}, timeoutMs = 30000 } = options;

  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const mod = url.protocol === "https:" ? https : http;

    const reqOpts = {
      method,
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + url.search,
      headers: {
        "content-type": "application/json",
        ...extraHeaders,
      },
      timeout: timeoutMs,
    };

    if (auth) {
      reqOpts.headers["authorization"] = `Bearer ${auth}`;
    }

    const req = mod.request(reqOpts, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString();
        let data;
        try { data = JSON.parse(raw); } catch { data = raw; }
        resolve({ status: res.statusCode, headers: res.headers, data });
      });
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("REQUEST_TIMEOUT"));
    });

    req.on("error", reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}
