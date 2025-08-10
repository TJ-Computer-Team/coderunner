use crate::models::{RunForm};
use crate::runner;
use actix_web::{post, web, HttpResponse, Responder};
use std::process::{Command};
use serde_json;
use std::fs;
use std::path::Path;
use uuid::Uuid;
use chrono::prelude::*;

#[post("/run")]
pub async fn run_code_handler(form: web::Form<RunForm>) -> impl Responder {
    let mut tl: u128 = form.tl_string.parse().expect("Failed to convert tl to u128");
    let ml: u64 = form.ml_string.parse().expect("Failed to convert ml to u64");
    let lang = form.lang.as_str();
    let problemid = &form.problemid;
    let subid = &form.subid;

    println!("{} - Started grading submission {}", Local::now().format("%Y-%m-%d %H:%M:%S"), subid);
    
    if !["python", "cpp", "java"].contains(&lang) {
        return HttpResponse::BadRequest().body("Unacceptable code language");
    }
    if problemid.is_empty() {
        return HttpResponse::BadRequest().body("You didn't select an actual problem");
    }
    
    let problem_base_path = Path::new("/home/tjctgrader/problems").join(&problemid);
    if !problem_base_path.exists() {
        return HttpResponse::BadRequest().body("Problem does not exist on coderunner filesystem");
    }
    let checker_path = problem_base_path.join("default_checker.py");
    let test_dir = problem_base_path.join("test");


    let subdir = Path::new("/home/tjctgrader/submissions").join(Uuid::new_v4().to_string());
    let _ = fs::create_dir_all(&subdir);

    let extension = match lang {
        "python" => "py",
        "java" => "java",
        "cpp" => "cpp",
        _ => unreachable!(),
    };


    let mut sol_filename = format!("usercode.{}", extension);
    let mut sol_path = subdir.join(&sol_filename);
    match fs::write(&sol_path, &form.code) {
        Ok(_) => {},
        Err(e) => {
            eprintln!("Failed to write to file: {}", e);
            std::process::exit(1);
        },
    }

    if lang == "cpp" || lang == "java" {
        let (compile_status, compile_stderr) = match lang {
            "cpp" => {
                let output = Command::new("g++")
                    .args([
                        "-std=c++17",
                        "-O2",
                        "-o",
                        subdir.join("usercode").to_str().unwrap(),
                        sol_path.to_str().unwrap(),
                    ])
                    .output()
                    .expect("Failed to run g++");

                sol_path = subdir.join("usercode");
                sol_filename = "usercode".to_string();
                (output.status, String::from_utf8_lossy(&output.stderr).to_string())
            }
            "java" => {
                let output = Command::new("javac")
                    .arg(sol_path.to_str().unwrap())
                    .output()
                    .expect("Failed to run javac");

                sol_path = subdir.join("usercode");
                sol_filename = "usercode".to_string();
                (output.status, String::from_utf8_lossy(&output.stderr).to_string())
            }
            _ => unreachable!(),
        };

        if !compile_status.success() {
            return HttpResponse::Ok().json(serde_json::json!({
                "verdict": "Compilation Error",
                "output": compile_stderr,
                "runtime": 0,
            }));
        }
    }


    let mut verdict_overall = "Accepted".to_string();
    let mut insight_overall = "".to_string();
    let mut overall_time = 0u128;

    let entries = match fs::read_dir(&test_dir) {
        Ok(entries) => entries,
        Err(_) => return HttpResponse::InternalServerError().body("Test cases not found"),
    };

    let mut sorted_entries: Vec<_> = entries
        .filter_map(|res| res.ok())
        .collect();
    
    sorted_entries.sort_by(|a, b| {
        a.file_name().cmp(&b.file_name())
    });

    if lang == "java" {
        tl *= 2;
    } else if lang == "python" {
        dbg!(&tl);
        tl *= 3;
    }

    for entry in &sorted_entries {
        let file_path = entry.path();
        let test_name = file_path.file_name().unwrap_or_default().to_str().unwrap_or_default();

        let run_result = runner::run_code(
            &subdir, Some(&file_path), lang, &sol_path, &sol_filename, tl, ml, false, None, None
        );

        let (output, insight, time_used) = match run_result {
            Ok(res) => res,
            Err(e) => {
                verdict_overall = "Grader Error".to_string();
                insight_overall = format!("Grader Error: {}", e);
                break;
            }
        };

        overall_time = overall_time.max(time_used);

        if output == "Runtime Error" {
            verdict_overall = "Runtime Error".to_string();
            insight_overall = insight;
            break;
        }
        if output == "Time Limit Exceeded" {
            verdict_overall = format!("Time Limit Exceeded on test {}", test_name);
            insight_overall = insight;
            break;
        }

        let checker_result = runner::run_code(
            &subdir, None, "python", &checker_path, "default_checker.py", 20000, 1024, true, Some(&test_name), Some(&problemid)
        );

        let (check_out, _, _) = match checker_result {
             Ok(res) => res,
             Err(e) => {
                verdict_overall = format!("Checker Error: {}", e);
                break;
            }
        };

        if !check_out.trim().eq_ignore_ascii_case("AC") && !check_out.trim().eq_ignore_ascii_case("Accepted") {
            verdict_overall = format!("Wrong Answer on test {}", test_name);
            break;
        }
    }

    // Comment for debugging
    let _ = fs::remove_dir_all(&subdir);

    println!("{} - Finished grading submission {}", Local::now().format("%Y-%m-%d %H:%M:%S"), subid);

    let resp = serde_json::json!({
        "verdict": verdict_overall,
        "output": insight_overall,
        "runtime": overall_time,
    });
    HttpResponse::Ok().json(resp)
}
