import { execSync, spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const DEFAULTS = {
  containerName: process.env.SMOKE_PG_CONTAINER || 'moy-smoke-postgres',
  postgresImage: process.env.SMOKE_PG_IMAGE || 'postgres:15-alpine',
  hostPort: process.env.SMOKE_PG_PORT || '55433',
  dbUser: process.env.SMOKE_PG_USER || 'postgres',
  dbPassword: process.env.SMOKE_PG_PASSWORD || 'postgres',
  dbNameRaw: process.env.SMOKE_DB_NAME || 'moy_smoke',
  backendPort: process.env.SMOKE_BACKEND_PORT || '3006',
};

export function resolveSmokeConfig() {
  const dbName = DEFAULTS.dbNameRaw.replace(/[^a-zA-Z0-9_]/g, '');
  if (!dbName) {
    throw new Error(`Invalid smoke database name: ${DEFAULTS.dbNameRaw}`);
  }

  return {
    containerName: DEFAULTS.containerName,
    postgresImage: DEFAULTS.postgresImage,
    hostPort: DEFAULTS.hostPort,
    dbUser: DEFAULTS.dbUser,
    dbPassword: DEFAULTS.dbPassword,
    dbName,
    backendPort: DEFAULTS.backendPort,
  };
}

export function run(command, options = {}) {
  return execSync(command, {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  }).trim();
}

export function runWithOutput(command, options = {}) {
  execSync(command, {
    stdio: 'inherit',
    ...options,
  });
}

export function isDockerAvailable() {
  try {
    run('docker --version');
    return true;
  } catch {
    return false;
  }
}

function isContainerExisting(containerName) {
  try {
    const output = run(
      `docker ps -a --filter "name=^/${containerName}$" --format "{{.Names}}"`,
    );
    return output === containerName;
  } catch {
    return false;
  }
}

function isContainerRunning(containerName) {
  try {
    const output = run(`docker inspect -f "{{.State.Running}}" ${containerName}`);
    return output === 'true';
  } catch {
    return false;
  }
}

export async function ensurePostgresContainer(config) {
  if (!isDockerAvailable()) {
    throw new Error(
      'Docker is required for smoke scripts. Please install/start Docker Desktop first.',
    );
  }

  if (!isContainerExisting(config.containerName)) {
    runWithOutput(
      [
        'docker run -d',
        `--name ${config.containerName}`,
        `-e POSTGRES_USER=${config.dbUser}`,
        `-e POSTGRES_PASSWORD=${config.dbPassword}`,
        '-e POSTGRES_DB=postgres',
        `-p ${config.hostPort}:5432`,
        config.postgresImage,
      ].join(' '),
    );
  } else if (!isContainerRunning(config.containerName)) {
    runWithOutput(`docker start ${config.containerName}`);
  }

  await waitForPostgresReady(config);
}

export async function waitForPostgresReady(config, maxAttempts = 90, intervalMs = 1000) {
  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      run(
        `docker exec ${config.containerName} pg_isready -U ${config.dbUser} -d postgres`,
      );
      return;
    } catch {
      await sleep(intervalMs);
    }
  }

  throw new Error(
    `Postgres in container ${config.containerName} is not ready after ${maxAttempts} attempts.`,
  );
}

export function resetDatabase(config) {
  const terminateSql = `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${config.dbName}' AND pid <> pg_backend_pid();`;
  const dropSql = `DROP DATABASE IF EXISTS ${config.dbName};`;
  const createSql = `CREATE DATABASE ${config.dbName};`;

  runWithOutput(
    [
      `docker exec ${config.containerName} psql`,
      `-U ${config.dbUser}`,
      '-d postgres',
      '-v ON_ERROR_STOP=1',
      `-c "${terminateSql}"`,
    ].join(' '),
  );
  runWithOutput(
    [
      `docker exec ${config.containerName} psql`,
      `-U ${config.dbUser}`,
      '-d postgres',
      '-v ON_ERROR_STOP=1',
      `-c "${dropSql}"`,
    ].join(' '),
  );
  runWithOutput(
    [
      `docker exec ${config.containerName} psql`,
      `-U ${config.dbUser}`,
      '-d postgres',
      '-v ON_ERROR_STOP=1',
      `-c "${createSql}"`,
    ].join(' '),
  );
}

export function ensureDatabaseExtensions(config) {
  runWithOutput(
    [
      `docker exec ${config.containerName} psql`,
      `-U ${config.dbUser}`,
      `-d ${config.dbName}`,
      '-v ON_ERROR_STOP=1',
      '-c "CREATE EXTENSION IF NOT EXISTS \\"uuid-ossp\\";"',
    ].join(' '),
  );
  runWithOutput(
    [
      `docker exec ${config.containerName} psql`,
      `-U ${config.dbUser}`,
      `-d ${config.dbName}`,
      '-v ON_ERROR_STOP=1',
      '-c "CREATE EXTENSION IF NOT EXISTS \\"pgcrypto\\";"',
    ].join(' '),
  );
}

export function buildBackendEnv(config, overrides = {}) {
  return {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'test',
    PORT: config.backendPort,
    ENABLE_TEST_SUPPORT_APIS: 'true',
    DB_HOST: '127.0.0.1',
    DB_PORT: config.hostPort,
    DB_USERNAME: config.dbUser,
    DB_PASSWORD: config.dbPassword,
    DB_NAME: config.dbName,
    DB_SYNCHRONIZE: 'false',
    DB_MIGRATIONS_RUN: 'false',
    DB_LOGGING: process.env.DB_LOGGING || 'false',
    JWT_SECRET: process.env.JWT_SECRET || 'moy-jwt-secret-key-change-in-production',
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    ...overrides,
  };
}

export function runNpmScript(script, envOverrides = {}, cwd = process.cwd()) {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  runWithOutput(`${npmCmd} run ${script}`, {
    cwd,
    env: {
      ...process.env,
      ...envOverrides,
    },
  });
}

export function startBackendProcess(env, cwd = process.cwd()) {
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const escapedCwd = cwd.includes(' ') ? `"${cwd}"` : cwd;
  const child = spawn(`${npmCmd} run start --prefix ${escapedCwd}`, {
    stdio: 'inherit',
    env,
    shell: true,
  });
  return child;
}

export async function waitForHttpReady(url, maxAttempts = 90, intervalMs = 1000) {
  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // no-op, retry
    }
    await sleep(intervalMs);
  }
  throw new Error(`HTTP endpoint was not ready in time: ${url}`);
}

export async function postJson(url, body, headers = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  return { response, data };
}

export async function stopProcessGracefully(child, signal = 'SIGTERM') {
  if (!child || child.killed || !child.pid) return;

  const pid = child.pid;

  if (process.platform === 'win32') {
    try {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
    } catch {
      // ignore missing process
    }
    return;
  }

  child.kill(signal);
  await Promise.race([
    new Promise((resolve) => child.once('exit', resolve)),
    sleep(5000).then(() => {
      try {
        child.kill('SIGKILL');
      } catch {
        // ignore
      }
    }),
  ]);
}

export function readMigrationCount(config) {
  const output = run(
    [
      `docker exec ${config.containerName} psql`,
      `-U ${config.dbUser}`,
      `-d ${config.dbName}`,
      '-t -A',
      '-c "SELECT COUNT(*) FROM migrations;"',
    ].join(' '),
  );

  const count = Number.parseInt(output, 10);
  if (Number.isNaN(count)) {
    throw new Error(`Cannot parse migrations count: ${output}`);
  }
  return count;
}
