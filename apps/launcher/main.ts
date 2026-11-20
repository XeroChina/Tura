#!/usr/bin/env bun
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const PROGRAM_DIR = "Program";
const DATA_DIR = "Data";
const MARKER_FILE = "portable";

function executableName(name: string): string {
  return process.platform === "win32" ? `${name}.exe` : name;
}

function launcherRoot(): string {
  return path.dirname(process.execPath);
}

function portableEnvironment(root: string): Record<string, string> {
  const programDir = path.join(root, PROGRAM_DIR);
  const dataDir = path.join(root, DATA_DIR);
  const env: Record<string, string> = {
    TURA_PORTABLE: "1",
    TURA_HOME: dataDir,
    TURA_PROJECT_ROOT: programDir,
    TURA_RELEASE_BIN_DIR: programDir,
    TURA_ENV_PATH: path.join(dataDir, ".env"),
  };
  const providerConfig = path.join(programDir, "config", "provider_config.json");
  if (existsSync(providerConfig)) {
    env.TURA_PROVIDER_CONFIG = providerConfig;
  }
  return env;
}

function startGui(target: string, env: NodeJS.ProcessEnv): number {
  const child = spawn(target, [], { detached: true, stdio: "ignore", env });
  child.on("error", (error) => {
    console.error(`Tura launcher could not start ${target}: ${error.message}`);
    process.exitCode = 1;
  });
  child.unref();
  return 0;
}

function startCli(target: string, args: string[], env: NodeJS.ProcessEnv): number {
  const result = spawnSync(target, args, { stdio: "inherit", env });
  if (result.error) {
    console.error(`Tura launcher could not start ${target}: ${result.error.message}`);
    return 1;
  }
  return result.status ?? 1;
}

function main(): number {
  const args = process.argv.slice(2);
  const root = launcherRoot();
  const programDir = path.join(root, PROGRAM_DIR);
  const dataDir = path.join(root, DATA_DIR);
  const portable = existsSync(path.join(root, MARKER_FILE));
  const gui = args.length === 0;
  const target = path.join(programDir, executableName(gui ? "tura_gui" : "tura"));

  if (!existsSync(target)) {
    console.error(
      `Tura launcher could not find ${gui ? "the GUI" : "the CLI"} at ${target}.`,
    );
    return 1;
  }

  const env: NodeJS.ProcessEnv = { ...process.env };
  if (portable) {
    try {
      mkdirSync(dataDir, { recursive: true });
    } catch (error) {
      console.error(
        `Tura launcher could not create the portable data directory ${dataDir}: ${error}`,
      );
      return 1;
    }
    Object.assign(env, portableEnvironment(root));
  }

  return gui ? startGui(target, env) : startCli(target, args, env);
}

process.exit(main());
