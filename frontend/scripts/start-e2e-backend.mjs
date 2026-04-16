import { execSync, spawn } from 'node:child_process';

const CONTAINER_NAME = process.env.PW_PG_CONTAINER || 'moy-e2e-postgres';
const POSTGRES_IMAGE = process.env.PW_PG_IMAGE || 'postgres:15-alpine';
const HOST_PORT = process.env.PW_PG_PORT || '55432';
const DB_USER = process.env.PW_PG_USER || 'postgres';
const DB_PASSWORD = process.env.PW_PG_PASSWORD || 'postgres';
const DB_NAME_RAW = process.env.PW_E2E_DB_NAME || 'moy_e2e';
const DB_NAME = DB_NAME_RAW.replace(/[^a-zA-Z0-9_]/g, '');

if (!DB_NAME) {
  throw new Error(`Invalid database name: ${DB_NAME_RAW}`);
}

function run(command, options = {}) {
  return execSync(command, {
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  }).trim();
}

function runWithOutput(command) {
  execSync(command, { stdio: 'inherit' });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isContainerExisting() {
  try {
    const output = run(`docker ps -a --filter "name=^/${CONTAINER_NAME}$" --format "{{.Names}}"`);
    return output === CONTAINER_NAME;
  } catch {
    return false;
  }
}

function isContainerRunning() {
  try {
    const output = run(`docker inspect -f "{{.State.Running}}" ${CONTAINER_NAME}`);
    return output === 'true';
  } catch {
    return false;
  }
}

async function waitForPostgresReady(maxAttempts = 60, intervalMs = 1000) {
  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      run(`docker exec ${CONTAINER_NAME} pg_isready -U ${DB_USER} -d postgres`);
      return;
    } catch {
      await sleep(intervalMs);
    }
  }
  throw new Error(`Postgres in container ${CONTAINER_NAME} was not ready after ${maxAttempts} attempts`);
}

function ensurePostgresContainer() {
  if (!isContainerExisting()) {
    runWithOutput(
      [
        'docker run -d',
        `--name ${CONTAINER_NAME}`,
        `-e POSTGRES_USER=${DB_USER}`,
        `-e POSTGRES_PASSWORD=${DB_PASSWORD}`,
        '-e POSTGRES_DB=postgres',
        `-p ${HOST_PORT}:5432`,
        POSTGRES_IMAGE,
      ].join(' '),
    );
    return;
  }

  if (!isContainerRunning()) {
    runWithOutput(`docker start ${CONTAINER_NAME}`);
  }
}

function resetE2EDatabase() {
  runWithOutput(
    [
      `docker exec ${CONTAINER_NAME} psql`,
      `-U ${DB_USER}`,
      '-d postgres',
      '-v ON_ERROR_STOP=1',
      `-c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${DB_NAME}' AND pid <> pg_backend_pid();"`,
    ].join(' '),
  );

  runWithOutput(
    [
      `docker exec ${CONTAINER_NAME} psql`,
      `-U ${DB_USER}`,
      '-d postgres',
      '-v ON_ERROR_STOP=1',
      `-c "DROP DATABASE IF EXISTS ${DB_NAME};"`,
    ].join(' '),
  );

  runWithOutput(
    [
      `docker exec ${CONTAINER_NAME} psql`,
      `-U ${DB_USER}`,
      '-d postgres',
      '-v ON_ERROR_STOP=1',
      `-c "CREATE DATABASE ${DB_NAME};"`,
    ].join(' '),
  );
}

async function main() {
  run('docker --version');
  ensurePostgresContainer();
  await waitForPostgresReady();
  resetE2EDatabase();

  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const backend = spawn(`${npmCmd} run start --prefix ../backend`, {
    shell: true,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: process.env.NODE_ENV || 'test',
      ENABLE_TEST_SUPPORT_APIS: 'true',
      DB_HOST: '127.0.0.1',
      DB_PORT: HOST_PORT,
      DB_USERNAME: DB_USER,
      DB_PASSWORD,
      DB_NAME,
      DB_SYNCHRONIZE: process.env.DB_SYNCHRONIZE || 'false',
      DB_LOGGING: process.env.DB_LOGGING || 'false',
    },
  });

  const forwardSignal = (signal) => {
    if (!backend.killed) {
      backend.kill(signal);
    }
  };

  process.on('SIGINT', () => forwardSignal('SIGINT'));
  process.on('SIGTERM', () => forwardSignal('SIGTERM'));

  backend.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 1);
  });
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
