#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import {
  DATA_KEEP_FILE,
  LAUNCHER_SOURCE_NAME,
  missingPortableFiles,
  PORTABLE_MARKER_FILE,
  PROGRAM_DIR_NAME,
  portableExecutableName,
  portableLayoutRoots,
  ROOT_LAUNCHER_NAME,
  stagePortableLayout,
} from "./portable-layout.mjs";

function writeFixtureFile(root, relativePath) {
  const file = path.join(root, relativePath);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, "fixture\n");
}

test("portable executable names follow the platform", () => {
  assert.equal(portableExecutableName("tura", "win32"), "tura.exe");
  assert.equal(portableExecutableName("tura_gui", "linux"), "tura_gui");
});

test("portable layout roots use Program, Data, and the portable marker", () => {
  const roots = portableLayoutRoots(path.join("root", "portable"));
  assert.equal(roots.programDir, path.join("root", "portable", PROGRAM_DIR_NAME));
  assert.equal(roots.dataDir, path.join("root", "portable", "Data"));
  assert.equal(roots.markerFile, path.join("root", "portable", PORTABLE_MARKER_FILE));
  assert.equal(
    roots.rootLauncher,
    path.join("root", "portable", portableExecutableName(ROOT_LAUNCHER_NAME))
  );
});

test("stagePortableLayout moves the release into Program and adds the launcher shell", () => {
  const stage = mkdtempSync(path.join(tmpdir(), "tura-portable-stage-"));
  try {
    const sourceRelease = path.join(stage, "target", "release");
    writeFixtureFile(sourceRelease, "tura.exe");
    writeFixtureFile(sourceRelease, "tura_gui.exe");
    writeFixtureFile(sourceRelease, "config/provider_config.json");
    writeFixtureFile(sourceRelease, "agents/src/balanced/prompt.md");
    const launcherBinary = path.join(stage, "launcher-source.exe");
    writeFileSync(launcherBinary, "launcher\n");

    const portableRoot = path.join(stage, "portable");
    const roots = stagePortableLayout({
      portableRoot,
      sourceReleaseDir: sourceRelease,
      launcherBinary,
      platform: "win32",
    });

    assert.deepEqual(
      Object.keys(roots).sort(),
      ["dataDir", "markerFile", "programDir", "rootLauncher"]
    );
    assert.equal(roots.programDir, path.join(portableRoot, PROGRAM_DIR_NAME));
    assert.ok(!existsSync(sourceRelease), "source release directory should be moved");
    for (const relative of [
      "tura.exe",
      "tura_gui.exe",
      "config/provider_config.json",
      "agents/src/balanced/prompt.md",
    ]) {
      assert.ok(existsSync(path.join(roots.programDir, relative)), `missing Program/${relative}`);
    }
    assert.equal(roots.rootLauncher, path.join(portableRoot, "tura.exe"));
    assert.ok(existsSync(roots.rootLauncher), "root launcher should exist");
    assert.ok(existsSync(roots.markerFile), "portable marker should exist");
    assert.ok(existsSync(path.join(roots.dataDir, DATA_KEEP_FILE)), "Data keep file should exist");
    assert.deepEqual(missingPortableFiles(portableRoot, "win32"), []);
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
});

test("missingPortableFiles reports the exact missing portable entries", () => {
  const stage = mkdtempSync(path.join(tmpdir(), "tura-portable-missing-"));
  try {
    const portableRoot = path.join(stage, "portable");
    mkdirSync(path.join(portableRoot, PROGRAM_DIR_NAME), { recursive: true });
    writeFixtureFile(portableRoot, `${PROGRAM_DIR_NAME}/tura.exe`);

    const missing = missingPortableFiles(portableRoot, "win32").map((file) =>
      path.relative(portableRoot, file).replaceAll("\\", "/")
    );
    assert.deepEqual(missing, ["tura.exe", "portable", "Program/tura_gui.exe", "Data"]);
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
});

test("portable layout constants keep the launcher source name stable", () => {
  assert.equal(LAUNCHER_SOURCE_NAME, "tura_launcher");
  assert.equal(ROOT_LAUNCHER_NAME, "tura");
});
