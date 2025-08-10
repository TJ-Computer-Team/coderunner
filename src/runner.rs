use std::fs;
use std::fs::File;
use std::io::{self};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio, Child};
use std::time::{Instant};


pub fn run_code(
    subdir: &Path,
    input_path: Option<&Path>,
    lang: &str,
    source_path: &PathBuf,
    source_filename: &str,
    tl: u128,
    ml: u64, // ml is in MB
    checker: bool,
    checker_testid: Option<&str>,
    checker_problemid: Option<&str>,
) -> io::Result<(String, String, u128)> {
    let mut cmd = if std::env::var("PROD").is_err() {
        let mut c = Command::new("sudo");
        c.arg("./nsjail/nsjail");
        c
    } else {
        Command::new("./nsjail/nsjail")
    };

    cmd.arg("--quiet");
    cmd.arg("--time_limit").arg((tl / 1000u128).to_string());
    cmd.arg("--cgroup_mem_max").arg((ml * 1024 * 1024).to_string());
    cmd.arg("--cgroup_pids_max").arg("10");
    
    let cfg = match (lang, checker) {
        ("cpp", _) => "nsjail/configs/executable.cfg",
        ("python", false) => "nsjail/configs/python.cfg",
        ("python", true) => "nsjail/configs/pythonchecker.cfg",
        ("java", _) => "nsjail/configs/java.cfg",
        _ => unreachable!(),
    };
    cmd.arg("--config").arg(cfg);

    match lang {
        "python" => cmd.arg("-R").arg(format!("{}:/subcode/{}", source_path.to_str().unwrap(), &source_filename)),
        "cpp" => cmd.arg("-R").arg(format!("{}:/subcode/{}", subdir.join("usercode").to_str().unwrap(), "usercode")),
        "java" => {
            let class_dir = source_path.parent().unwrap();
            cmd.arg("-R").arg(format!("{}:/subcode", class_dir.to_str().unwrap()))
        },
        _ => unreachable!(),
    };

    if checker {
        cmd.arg("-R").arg(format!("/home/tjctgrader/problems/{}/sol/{}:/subcode/sol.txt", checker_problemid.unwrap(), checker_testid.unwrap()));
        cmd.arg("-R").arg(format!("/home/tjctgrader/problems/{}/test/{}:/subcode/test.txt", checker_problemid.unwrap(), checker_testid.unwrap()));
        cmd.arg("-R").arg(format!("{}/output.txt:/subcode/output.txt", subdir.to_str().unwrap()));
    }
    
    match (lang, checker) {
        ("cpp", _) => cmd.arg("/subcode/usercode"),
        ("python", false) => cmd.arg("/usr/bin/python3").arg(format!("/subcode/{}", &source_filename)),
        ("python", true) => cmd.arg("/usr/bin/python3").arg("/subcode/default_checker.py"),
        ("java", _) => {
            let class_name = source_filename.split('.').next().unwrap_or("usercode");
            cmd.arg("/usr/bin/java").arg(class_name)
        },
        _ => unreachable!(),
    };

    let out_path = if checker {
        subdir.join("checker_output.txt")
    } else {
        subdir.join("output.txt")
    };

    if let Some(path) = input_path {
        let input_file = File::open(path)?;
        cmd.stdin(Stdio::from(input_file));
    }

    let output_file = File::create(&out_path)?;
    cmd.stdout(Stdio::from(output_file));
    cmd.stderr(Stdio::piped());


    let start = Instant::now();
    let child: Child = cmd.spawn()?;
    let output = child.wait_with_output()?;
    let elapsed = start.elapsed().as_millis();

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        if elapsed >= tl {
            return Ok(("Time Limit Exceeded".to_string(), "".to_string(), tl));
        } else {
            return Ok(("Runtime Error".to_string(), stderr, elapsed));
        }
    }
    
    Ok((fs::read_to_string(&out_path).unwrap_or_default(), "".to_string(), elapsed))
}