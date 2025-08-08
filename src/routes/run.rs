use crate::models::{RunForm};
use crate::runner;
use actix_web::{post, web, HttpResponse, Responder};
use serde_json;
use std::fs;
use std::path::Path;
use uuid::Uuid;

#[post("/run")]
pub async fn run_code_handler(form: web::Form<RunForm>) -> impl Responder {
    let tl: u128 = form.tl_string.parse().expect("Failed to convert tl to u128");
    let ml: u64 = form.ml_string.parse().expect("Failed to convert ml to u64");
    let lang = form.lang.as_str();
    if !["python", "cpp", "java"].contains(&lang) {
        return HttpResponse::BadRequest().body("Unacceptable code language");
    }
    if form.problemid.is_empty() {
        return HttpResponse::BadRequest().body("You didn't select an actual problem");
    }
    
    let problem_base_path = Path::new("/home/tjctgrader/problems").join(&form.problemid);
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


    let sol_filename = format!("usercode.{}", extension);
    let sol_path = subdir.join(&sol_filename);
    match fs::write(&sol_path, &form.code) {
        Ok(_) => {},
        Err(e) => {
            eprintln!("Failed to write to file: {}", e);
            std::process::exit(1);
        },
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

    for entry in &sorted_entries {
        let file_path = entry.path();
        let test_name = file_path.file_name().unwrap_or_default().to_str().unwrap_or_default();

        let mut actual_tl = tl;
        if lang == "java" {
            actual_tl *= 2;
        } else if lang == "python" {
            actual_tl *= 3;
        }

        let run_result = runner::run_code(
            &subdir, Some(&file_path), lang, &sol_path, &sol_filename, actual_tl, ml, false, None, None
        );

        let (output, insight, time_used) = match run_result {
            Ok(res) => res,
            Err(e) => {
                verdict_overall = "Grader Error".to_string();
                insight_overall = format!("Grader Error: {}", e);
                break;
            }
        };

        if output == "Compilation Error".to_string() {
            verdict_overall = "Compilation Error".to_string();
            insight_overall = insight;
            break;
        }

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
        if output == "Memory Limit Exceeded" {
            verdict_overall = format!("Memory Limit Exceeded on test {}", test_name);
            break;
        }

        let checker_result = runner::run_code(
            &subdir, None, "python", &checker_path, "default_checker.py", 20000, 1024, true, Some(&test_name), Some(&form.problemid)
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
    // let _ = fs::remove_dir_all(&subdir);

    let resp = serde_json::json!({
        "verdict": verdict_overall,
        "output": insight_overall,
        "runtime": overall_time,
    });
    dbg!(&resp);
    HttpResponse::Ok().json(resp)
}
