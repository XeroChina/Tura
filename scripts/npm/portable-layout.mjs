import { cpSync, existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

export const PORTABLE_MARKER_FILE = "portable";
export const PROGRAM_DIR_NAME = "Program";
export const DATA_DIR_NAME = "Data";
export const LAUNCHER_SOURCE_NAME = "tura_launcher";
export const ROOT_LAUNCHER_NAME = "tura";
export const DATA_KEEP_FILE = ".gitkeep";

export function portableExecutableName(name, platform = process.platform) {
  return platform === "win32" ? `${name}.exe` : name;
}

export function portableLayoutRoots(portableRoot) {
  return {
    programDir: path.join(portableRoot, PROGRAM_DIR_NAME),
    dataDir: path.join(portableRoot, DATA_DIR_NAME),
    markerFile: path.join(portableRoot, PORTABLE_MARKER_FILE),
    rootLauncher: path.join(portableRoot, portableExecutableName(ROOT_LAUNCHER_NAME)),
  };
}

/**
 * Move a staged `target/release` tree into the portable `Program/` directory and
 * add the root launcher, the `portable` marker, and the `Data/` directory.
 * Returns the resolved portable paths.
 */
export function stagePortableLayout({
  portableRoot,
  sourceReleaseDir,
  launcherBinary,
  platform = process.platform,
}) {
  const roots = portableLayoutRoots(portableRoot);
  mkdirSync(portableRoot, { recursive: true });
  renameSync(sourceReleaseDir, roots.programDir);
  cpSync(launcherBinary, roots.rootLauncher);
  writeFileSync(roots.markerFile, "");
  mkdirSync(roots.dataDir, { recursive: true });
  writeFileSync(path.join(roots.dataDir, DATA_KEEP_FILE), "");
  return roots;
}

export function missingPortableFiles(portableRoot, platform = process.platform) {
  const roots = portableLayoutRoots(portableRoot);
  const required = [
    roots.rootLauncher,
    roots.markerFile,
    path.join(roots.programDir, portableExecutableName("tura", platform)),
    path.join(roots.programDir, portableExecutableName("tura_gui", platform)),
    roots.dataDir,
  ];
  return required.filter((candidate) => !existsSync(candidate));
}
