import {
  resolveSmokeConfig,
  ensurePostgresContainer,
  resetDatabase,
  ensureDatabaseExtensions,
  buildBackendEnv,
  runNpmScript,
  startBackendProcess,
  waitForHttpReady,
  postJson,
  stopProcessGracefully,
} from './smoke-common.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

async function main() {
  const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const config = resolveSmokeConfig();
  const backendEnv = buildBackendEnv(config);
  const baseUrl = `http://127.0.0.1:${config.backendPort}/api/v1`;

  // eslint-disable-next-line no-console
  console.log('[smoke:test-support] Preparing isolated smoke database...');
  await ensurePostgresContainer(config);
  resetDatabase(config);
  ensureDatabaseExtensions(config);

  // eslint-disable-next-line no-console
  console.log('[smoke:test-support] Applying migrations...');
  runNpmScript('migration:run', backendEnv, backendRoot);

  // eslint-disable-next-line no-console
  console.log('[smoke:test-support] Starting backend process...');
  const backend = startBackendProcess(backendEnv, backendRoot);

  try {
    let isReady = false;
    const backendExitBeforeReady = new Promise((_, reject) => {
      backend.once('exit', (code) => {
        if (isReady) return;
        reject(
          new Error(
            `[smoke:test-support] Backend exited before ready (exit code: ${code ?? 'unknown'}).`,
          ),
        );
      });
    });

    await Promise.race([waitForHttpReady(`${baseUrl}/docs`), backendExitBeforeReady]);
    isReady = true;
    // eslint-disable-next-line no-console
    console.log('[smoke:test-support] Backend ready, validating login + test-support APIs...');

    const loginResult = await postJson(`${baseUrl}/auth/login`, {
      username: 'admin',
      password: 'Admin123!',
    });

    if (!loginResult.response.ok) {
      throw new Error(
        `[smoke:test-support] Login failed: ${loginResult.response.status} ${JSON.stringify(loginResult.data)}`,
      );
    }

    const loginData = loginResult.data;
    const token = loginData?.tokens?.accessToken;
    const primaryOrgId = loginData?.user?.orgId;
    if (!token || !primaryOrgId) {
      throw new Error(
        '[smoke:test-support] Login payload missing access token or primary org id.',
      );
    }

    const ensureTenantResult = await postJson(
      `${baseUrl}/auth/test-support/ensure-secondary-tenant`,
      {},
      {
        authorization: `Bearer ${token}`,
      },
    );

    if (!ensureTenantResult.response.ok) {
      throw new Error(
        `[smoke:test-support] ensure-secondary-tenant failed: ${ensureTenantResult.response.status} ${JSON.stringify(ensureTenantResult.data)}`,
      );
    }

    const secondaryOrgId = ensureTenantResult.data?.orgId;
    if (!secondaryOrgId) {
      throw new Error(
        '[smoke:test-support] ensure-secondary-tenant response missing orgId.',
      );
    }

    if (secondaryOrgId === primaryOrgId) {
      throw new Error(
        '[smoke:test-support] Secondary tenant orgId should differ from primary orgId.',
      );
    }

    // eslint-disable-next-line no-console
    console.log(
      `[smoke:test-support] PASS. primaryOrgId=${primaryOrgId}, secondaryOrgId=${secondaryOrgId}`,
    );
  } finally {
    await stopProcessGracefully(backend);
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
