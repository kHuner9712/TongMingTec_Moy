import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { chromium, firefox, webkit } from 'playwright';

const PROJECTS = {
  chromium: {
    browserType: chromium,
    installCommand: 'npm run pw:install:chromium',
  },
  firefox: {
    browserType: firefox,
    installCommand: 'npm run pw:install:firefox',
  },
  webkit: {
    browserType: webkit,
    installCommand: 'npm run pw:install:webkit',
  },
};

function printUsageAndExit() {
  // eslint-disable-next-line no-console
  console.error(
    '[playwright-runner] Usage: node ./scripts/run-playwright-project.mjs <chromium|firefox|webkit> [spec-file] [extra playwright args]',
  );
  process.exit(1);
}

function resolveBrowserCheck(project) {
  const config = PROJECTS[project];
  if (!config) return { ok: false, reason: `Unsupported project: ${project}` };

  try {
    const executablePath = config.browserType.executablePath();
    if (executablePath && fs.existsSync(executablePath)) {
      return { ok: true, executablePath };
    }
    return {
      ok: false,
      executablePath,
      reason: 'Browser executable does not exist on disk.',
      installCommand: config.installCommand,
    };
  } catch (error) {
    return {
      ok: false,
      reason:
        error instanceof Error ? error.message : 'Failed to resolve browser executable path.',
      installCommand: config.installCommand,
    };
  }
}

function runPlaywright(project, specFile, extraArgs) {
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const args = ['playwright', 'test', '--project', project];

  if (specFile) {
    args.push(specFile);
  }
  args.push(...extraArgs);

  const child = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
  });

  if (child.error) {
    throw child.error;
  }

  process.exit(child.status ?? 1);
}

function main() {
  const [, , projectArg, ...restArgs] = process.argv;
  if (!projectArg) printUsageAndExit();

  let specFile;
  const extraArgs = [...restArgs];
  if (extraArgs[0] && !extraArgs[0].startsWith('-')) {
    specFile = extraArgs.shift();
  }

  const browserCheck = resolveBrowserCheck(projectArg);
  if (!browserCheck.ok) {
    // eslint-disable-next-line no-console
    console.error(`[playwright-runner] Cannot run project "${projectArg}".`);
    if (browserCheck.executablePath) {
      // eslint-disable-next-line no-console
      console.error(`[playwright-runner] Expected executable: ${browserCheck.executablePath}`);
    }
    // eslint-disable-next-line no-console
    console.error(`[playwright-runner] Reason: ${browserCheck.reason}`);
    if (browserCheck.installCommand) {
      // eslint-disable-next-line no-console
      console.error(`[playwright-runner] Install browser binaries first: ${browserCheck.installCommand}`);
    }
    // eslint-disable-next-line no-console
    console.error('[playwright-runner] This is an environment prerequisite issue, not a test assertion failure.');
    process.exit(2);
  }

  runPlaywright(projectArg, specFile, extraArgs);
}

main();
