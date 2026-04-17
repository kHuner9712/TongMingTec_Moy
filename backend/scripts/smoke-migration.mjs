import {
  resolveSmokeConfig,
  ensurePostgresContainer,
  resetDatabase,
  ensureDatabaseExtensions,
  buildBackendEnv,
  runNpmScript,
  readMigrationCount,
} from './smoke-common.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

async function main() {
  const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const config = resolveSmokeConfig();

  // eslint-disable-next-line no-console
  console.log('[smoke:migration] Preparing isolated smoke database...');
  await ensurePostgresContainer(config);
  resetDatabase(config);
  ensureDatabaseExtensions(config);

  // eslint-disable-next-line no-console
  console.log('[smoke:migration] Running migration:run against isolated database...');
  runNpmScript('migration:run', buildBackendEnv(config), backendRoot);

  const migrationCount = readMigrationCount(config);
  if (migrationCount <= 0) {
    throw new Error('[smoke:migration] No migration records found after migration:run.');
  }

  // eslint-disable-next-line no-console
  console.log(
    `[smoke:migration] PASS. Applied migrations in isolated DB: ${migrationCount}`,
  );
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
