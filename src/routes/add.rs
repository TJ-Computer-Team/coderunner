use crate::models::AddTestForm;
use crate::models::AddProblemForm;
use actix_web::{post, web, HttpResponse, Responder};
use std::fs;
use std::path::Path;

#[post("/addTest")]
pub async fn add_test(form: web::Form<AddTestForm>) -> impl Responder {
    let base = Path::new("../problems").join(&form.pid);
    let sol_dir = base.join("sol");
    let test_dir = base.join("test");

    if let Err(e) = fs::create_dir_all(&sol_dir).and_then(|_| fs::create_dir_all(&test_dir)) {
        eprintln!("Dir error: {}", e);
        return HttpResponse::InternalServerError().body("Error creating test directories");
    }

    if let Err(e) = fs::write(test_dir.join(&form.tid), &form.test)
        .and_then(|_| fs::write(sol_dir.join(&form.tid), &form.out))
    {
        eprintln!("Write error: {}", e);
        return HttpResponse::InternalServerError().body("Error writing test files");
    }

    HttpResponse::Ok().body("Test added")
}

#[post("/addProblem")]
pub async fn add_problem(form: web::Form<AddProblemForm>) -> impl Responder {
    let loc = Path::new("../problems").join(&form.pid);
    if let Err(e) = fs::create_dir_all(&loc) {
        eprintln!("Dir error: {}", e);
        return HttpResponse::InternalServerError().body("Error creating problem directory");
    }
    let checker = fs::read_to_string("/home/tjctgrader/coderunner/dev/default_checker.py").unwrap_or_default();
    if let Err(e) = fs::write(loc.join("default_checker.py"), checker) {
        eprintln!("Write error: {}", e);
        return HttpResponse::InternalServerError().body("Error writing checker file");
    }
    HttpResponse::Ok().body(format!("Added problem {} to coderunner", &form.pid))
}