use serde::Deserialize;

#[derive(Deserialize)]
pub struct AddTestForm {
    pub pid: String,
    pub tid: String,
    pub test: String,
    pub out: String,
}

#[derive(Deserialize)]
pub struct AddProblemForm {
    pub pid: String,
}

#[derive(Deserialize)]
pub struct RunForm {
    pub lang: String,
    pub problemid: String,
    pub tl_string: String,
    pub ml_string: String,
    pub code: String,
}