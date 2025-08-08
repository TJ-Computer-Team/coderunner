use actix_web::web;

pub mod add;
pub mod run;

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(add::add_test)
       .service(add::add_problem)
       .service(run::run_code_handler);
}
