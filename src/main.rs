use actix_web::{App, HttpServer};
use dotenv::dotenv;
use std::io;

mod routes;
mod models;
mod runner;

#[actix_web::main]
async fn main() -> io::Result<()> {
    dotenv().ok();

    let port: u16 = std::env::var("PORT")
        .unwrap_or_else(|_| "8080".into())
        .parse()
        .expect("PORT must be a valid number");

    println!("Server starting on 0.0.0.0:{}", port);

    HttpServer::new(|| {
        App::new()
            .configure(routes::configure)
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
