//! Native portable launcher for the Windows release archive.
//!
//! Archive layout:
//!
//! ```text
//! <root>/
//!   tura.exe        this launcher
//!   portable        marker that activates portable user-data routing
//!   Program/        executables and read-only runtime resources
//!   Data/           user-writable state (.env, .tura/, db/)
//! ```
//!
//! With the marker present the launcher points `TURA_HOME` at `Data/` and the
//! runtime root at `Program/`, so no user file is written beside the binaries.
//! Without the marker it behaves as a thin shortcut and leaves the default path
//! resolution untouched. With no arguments it starts the GUI, otherwise it
//! forwards the arguments to the CLI.

use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

const PROGRAM_DIR: &str = "Program";
const DATA_DIR: &str = "Data";
const MARKER_FILE: &str = "portable";
const PORTABLE_ENV: &str = "TURA_PORTABLE";
const HOME_ENV: &str = "TURA_HOME";
const PROJECT_ROOT_ENV: &str = "TURA_PROJECT_ROOT";
const RELEASE_BIN_DIR_ENV: &str = "TURA_RELEASE_BIN_DIR";
const ENV_PATH_ENV: &str = "TURA_ENV_PATH";
const PROVIDER_CONFIG_ENV: &str = "TURA_PROVIDER_CONFIG";

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let root = launcher_root();
    let program_dir = root.join(PROGRAM_DIR);
    let data_dir = root.join(DATA_DIR);
    let portable = root.join(MARKER_FILE).is_file();
    let gui = args.is_empty();
    let target = program_dir.join(executable_name(if gui { "tura_gui" } else { "tura" }));

    if !target.is_file() {
        eprintln!(
            "Tura launcher could not find {} at {}.",
            if gui { "the GUI" } else { "the CLI" },
            target.display()
        );
        std::process::exit(1);
    }

    let mut command = Command::new(target.as_os_str());
    command.args(&args);
    if portable {
        if let Err(error) = std::fs::create_dir_all(&data_dir) {
            eprintln!(
                "Tura launcher could not create the portable data directory {}: {error}",
                data_dir.display()
            );
            std::process::exit(1);
        }
        command
            .env(PORTABLE_ENV, "1")
            .env(HOME_ENV, data_dir.as_path())
            .env(PROJECT_ROOT_ENV, program_dir.as_path())
            .env(RELEASE_BIN_DIR_ENV, program_dir.as_path())
            .env(ENV_PATH_ENV, data_dir.join(".env"));
        let provider_config = program_dir.join("config").join("provider_config.json");
        if provider_config.is_file() {
            command.env(PROVIDER_CONFIG_ENV, provider_config.as_path());
        }
    }

    if gui {
        command
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null());
        if let Err(error) = command.spawn() {
            eprintln!(
                "Tura launcher could not start {}: {error}",
                target.display()
            );
            std::process::exit(1);
        }
    } else {
        match command.status() {
            Ok(status) => std::process::exit(status.code().unwrap_or(1)),
            Err(error) => {
                eprintln!(
                    "Tura launcher could not start {}: {error}",
                    target.display()
                );
                std::process::exit(1);
            }
        }
    }
}

fn launcher_root() -> PathBuf {
    std::env::current_exe()
        .ok()
        .and_then(|executable| executable.parent().map(Path::to_path_buf))
        .unwrap_or_else(|| PathBuf::from("."))
}

fn executable_name(name: &str) -> String {
    if cfg!(windows) {
        format!("{name}.exe")
    } else {
        name.to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::{executable_name, launcher_root};

    #[test]
    fn executable_names_follow_the_platform() {
        if cfg!(windows) {
            assert_eq!(executable_name("tura"), "tura.exe");
            assert_eq!(executable_name("tura_gui"), "tura_gui.exe");
        } else {
            assert_eq!(executable_name("tura"), "tura");
            assert_eq!(executable_name("tura_gui"), "tura_gui");
        }
    }

    #[test]
    fn launcher_root_is_never_empty() {
        assert!(!launcher_root().as_os_str().is_empty());
    }
}
