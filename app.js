require('dotenv').config();
const express = require("express");
const app = express();
const port = 8080;
const {
    run,
    addTests,
    addProblem,
} = require("./routes/runCode");
app.use(express.urlencoded({
    extended: false
}));

app.post("/addTest", async (req, res) => {
    addTests(req.body.pid, req.body.tid, req.body.test, req.body.out)
    res.send("Test added")
});

app.post("/addProblem", async (req, res) => {
    addProblem(req.body.pid);
    res.send("Added problem " + req.body.pid + " to coderunner");
});

app.post("/run", async (req, res) => {
    let language = req.body.lang;
    if (language != 'python' && language != 'cpp' && language != 'java') {
        res.send("Unacceptable code language");
        return;
    }
    let pid = req.body.problemid;
    if (pid == "") {
        res.send("You didn't select an actual problem");
        return;
    }
    let tl = req.body.tl;
    let ml = req.body.ml;
    if (isNaN(tl) || isNaN(ml)) {
        res.send("Invalid values");
    }
    code = {
        "code": req.body.code,
        "language": language
    }
    problem = {
        "id": parseInt(pid),
        "tl": parseInt(tl),
        "ml": parseInt(ml),
        "checkid": -1 // custom checker to be added
    }
    let result = await run(problem, code);
    res.send(result)
});

console.log("Application started");
app.listen(port, '0.0.0.0');
