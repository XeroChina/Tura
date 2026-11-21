# Release packages

Tura currently publishes the Windows x64 release only; macOS and Linux packages
are not produced. Each GitHub Release contains the Windows packages described
below.

## Release notes

The current release is
[Tura 0.1.37](https://github.com/Tura-AI/tura/blob/v0.1.37/docs/changelog/0.1.37.md).
The repository [changelog](../../CHANGELOG.md) links to notes for every
published version.

## GUI-only installer

`tura-gui-only-<tag>-windows-x64-setup.exe` installs only the native desktop GUI.
It does not include the Tura gateway, CLI, TUI, runtime workers, or command
packages. The GUI must connect to an already running Tura gateway. If Tura is not
already installed, use the full release archive or the `tura-ai` npm package
first.

Download it from the
[latest GitHub Release](https://github.com/Tura-AI/tura/releases/latest). Use the
`.msi` variant for managed installation.

Start Tura from the full installation so its gateway is available, then open the
GUI-only application. If the gateway runs at a non-default address, provide that
gateway URL in the GUI.

## Full release archive

`tura-<tag>-windows-x64.zip` contains the complete local release: the CLI and
TUI, GUI executable, gateway and runtime services, provider config, prompts, and
command packages.

The Windows archive is portable. Extracting it produces this layout:

```text
tura.exe      launcher: double-click for the GUI, or pass CLI arguments
portable      marker that routes all user files into Data/
Program/      executables and runtime resources (CLI, GUI, gateway, prompts)
Data/         user state: .env, .tura/, db/session_log
```

Run `tura.exe` with no arguments to open the GUI, or pass CLI arguments such as
`tura.exe --help` to use the terminal CLI. While the `portable` marker is present,
instance state and provider credentials are written under `Data/`; removing the
marker restores the default location-based behavior. Keep `tura.exe`, `Program/`,
and `Data/` together so the launcher can find them.

## npm package

For the simplest CLI installation with npm on Windows:

```bash
npm install --global tura-ai
tura
```

`tura-ai` is the main package and depends on the `tura-win32-x64` platform
package. The platform `.tgz` contains native executables and runtime files, but
deliberately excludes the Tauri desktop installers. Do not use it as a GUI
installer.

The main package is also mirrored to GitHub Packages as `@tura-ai/tura`.

## Source archives

GitHub automatically adds source code `.zip` and `.tar.gz` files to each
release. These contain the repository source and require a local build. For
source installation instructions, see [Install and Uninstall](install.md).
