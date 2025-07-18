const execSync = require('child_process').execSync;

const fs = require("fs");
const path = require("path");

function addTests(pid, tid, test, out) {
    const loc = path.join("..", "problems", pid);
    const solDir = path.join(loc, "sol");
    const testDir = path.join(loc, "test");

    try {
        fs.mkdirSync(solDir, { recursive: true });
        fs.mkdirSync(testDir, { recursive: true });

        fs.writeFileSync(path.join(testDir, tid), test);
        fs.writeFileSync(path.join(solDir, tid), out);
    } catch (error) {
        console.error("Failed to add tests:", error);
        throw error;
    }
}

function addProblem(pid) {
    const loc = path.join("..", "problems", pid);

    try {
        fs.mkdirSync(loc, { recursive: true });

        const checker = fs.readFileSync("/home/tjctgrader/coderunner/dev/code", "utf8");

        fs.writeFileSync(path.join(loc, "code"), checker);
    } catch (error) {
        console.error("Failed to add problem:", error);
        throw error;
    }
}


async function runCode(input_file, lang, solution, tl, ml, compile = false, checker = false) {
    let output = ''
    let start = 0;
    let end = -1;
    let time_suffix = '';
    if (tl != 1000 && (tl % 1000 == 0 && tl <= 8000 || tl == 20000)) {
        time_suffix = String(tl/100);
    }
    if (lang == 'cpp') {
        fs.writeFileSync('subcode/test.cpp', solution);
        try {
            
            str = 'sudo ./nsjail/nsjail --quiet --config nsjail/configs/executable' + time_suffix + '.cfg < ' + input_file + " > subcode/output.txt";
            if (process.env.PROD == 'false') {
                str = str.slice(5);
            }
            if (compile) {
                output = execSync("g++ -std=c++17 -o subcode/a.out subcode/test.cpp", {
                    encoding: 'utf-8'
                });
            }
            start = performance.now();
            output = execSync(str, {
                encoding: 'utf-8'
            });
            end = performance.now();
        } catch (error) {
            console.log("Error when trying to run C++ code:", error);
            payload = {
                output: error['stderr'],
                time: -1
            }
            return payload;
        }
    } else if (lang == 'python') {
        fs.writeFileSync('subcode/test.py', solution);
        try {
            str = 'sudo ./nsjail/nsjail --quiet --config nsjail/configs/python' + time_suffix + '.cfg < ' + input_file + " > subcode/output.txt";
            if (checker) {
                str = 'sudo ./nsjail/nsjail --quiet --config nsjail/configs/pythonchecker' + time_suffix + '.cfg < ' + input_file;
            }
            if (process.env.PROD == 'false') {
                str = str.slice(5);
            }
            start = performance.now();
            output = execSync(str, {
                encoding: 'utf-8'
            });
            end = performance.now();
        } catch (error) {
            console.log("Error when trying to run Python code:", error);
            payload = {
                output: error['stderr'],
                time: -1
            }
            return payload;
        }
    } else if (lang == 'java') {
        fs.writeFileSync('subcode/test.java', solution);
        try {
            str = 'sudo ./nsjail/nsjail --quiet --config nsjail/configs/java' + time_suffix + '.cfg < ' + input_file + " > subcode/output.txt";
            if (process.env.PROD == 'false') {
                str = str.slice(5);
            }
            output = execSync("javac subcode/test.java", {
                encoding: 'utf-8'
            });
            start = performance.now()+800; // scuffed fix for Java extra runtime
            output = execSync(str, {
                encoding: 'utf-8'
            });
            end = performance.now();
        } catch (error) {
            console.log("Error when trying to run Java code:", error);
            payload = {
                output: error['stderr'],
                time: -1
            }
            return payload;
        }
    } else {
        console.log("Invalid language when trying to run code");
    }
    rt = end - start;
    payload = {
        output: output,
        time: parseInt(rt)
    }
    return payload;
}

async function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function run(problem, submit) {
    let loc = "/home/tjctgrader/problems/" + problem.id + "/test/";
    let loc2 = "/home/tjctgrader/problems/" + problem.id + "/code";
    let checkid = problem.checkid;
    let tl = problem.tl;
    let ml = problem.ml;
    let userCode = submit.code;
    let language = submit.language;
    return new Promise((res, rej) => {
        let payload = {
            verdict: "ERROR",
            output: undefined
        }
        let maxtime = -1;
        try {
            checkerCode = fs.readFileSync(loc2, {
                encoding: 'utf8',
                flag: 'r'
            })
        } catch (error) {
            console.log("Error in run:", error);
            payload.verdict = "ERROR"
            payload.output = "Problem ID not found"
            res(payload)
        }
        fs.readdir(loc, async (err, files) => {
            if (err) {
                console.log("Error in run:", err);
                return;
            }
            let testnum = 0;
            let solved = true;
            for (_ in files) {
                i = files[_]
                let outputfull;
                let output;
                let compError = false
                for (let iterations = 0; iterations < 2; iterations++) {
                    rerun = false;
                    outputfull = await runCode(loc + i, language, userCode, tl, ml, true)
                    output = outputfull.output;
                    if (outputfull.time > maxtime) maxtime = outputfull.time;
                    if (outputfull.time == -1) {
                        solved = false;
                        payload.verdict = "Compilation/Runtime Error"
                        if (output.includes("run time >= time limit")) {
                            rerun = true;
                            payload.verdict = "Time Limit Exceeded"
                            if (language == 'cpp') maxtime = tl;
                            else if (language == 'java') maxtime = tl * 2;
                            else if (language == 'python') maxtime = tl * 3;
                        } else if (output.includes("MemoryError") || output.includes("StackOverflowError")) {
                            payload.verdict = "Memory Limit Exceeded"
                            rerun = true;
                        }
                        payload.runtime = maxtime
                        output = output.replace(/^\[I\].*/gm, '');
                        output = output.trim()
                        payload.output = output
                        console.log("Code got TLE, MLE, RTE, CPE")
                        compError = true
                    }
                    if (!rerun) {
                        break;
                    }
                }
                if (compError) {
                    res(payload);
                    break;
                }
                fs.writeFileSync("subcode/args.txt", problem.id + " " + i)
                juryAnswer = await runCode("subcode/args.txt", "python", checkerCode, -1, -1, true, true);
                juryAnswer = juryAnswer.output;
                if (juryAnswer.includes("run time >= time limit")) {
                    console.log("Checker timeout error");
                    payload.verdict = "ERROR";
                    payload.output = "System Error: checker timed out";
                    payload.runtime = maxtime;
                    solved = false;
                    res(payload);
                    break;
                }
                if (!(juryAnswer.trim() === "AC" || juryAnswer.trim() === "Accepted")) {
                    payload.verdict = "Wrong Answer";
                    payload.output = "Failed on test " + testnum + ":\n" + juryAnswer;
                    if (testnum >= 1) {
                        payload.output = "Viewing as admin:\n" + payload.output;
                    }
                    payload.runtime = maxtime;
                    solved = false;
                    res(payload);
                    break;
                }
                testnum += 1;
                compile = false;
            }
            if (solved) {
                payload.verdict = "Accepted";
                payload.runtime = maxtime;
                payload.output = "All tests correct - no additional feedback"
                res(payload);
            }
        });
    });
}


module.exports = {
    run: (problem, submit) => {
        return run(problem, submit);
    },
    addTests: (problem, tid, test, out) => {
        return addTests(problem, tid, test, out);
    },
    addProblem: (pid, checker) => {
        return addProblem(pid, checker);
    }
}
