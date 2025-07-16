const execSync = require('child_process').execSync;
const fs = require('fs');
const {
    add
} = require("./sql");

async function addTests(pid, tid, test, out) { // not used
    let loc = "../problems/" + pid;
    if (!fs.existsSync(loc + pid)) {
        fs.mkdirSync(loc + "/sol", {
            recursive: true
        });
    }
    if (!fs.existsSync(loc + pid)) {
        fs.mkdirSync(loc + "/test", {
            recursive: true
        });
    }
    fs.writeFileSync(loc + "/test/" + tid, test);
    fs.writeFileSync(loc + "/sol/" + tid, out);
}
async function addChecker(pid, code) { // not used
    let loc = "../problems/" + pid;
    if (!fs.existsSync(loc + pid)) {
        fs.mkdirSync(loc + "/sol", {
            recursive: true
        });
    }
    if (!fs.existsSync(loc + pid)) {
        fs.mkdirSync(loc + "/test", {
            recursive: true
        });
    }
    fs.writeFileSync(loc + "/code", code);
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
            str = 'sudo ./nsjail/nsjail --config nsjail/configs/executable' + time_suffix + '.cfg < ' + input_file + " > subcode/output.txt";
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
            str = 'sudo ./nsjail/nsjail --config nsjail/configs/python' + time_suffix + '.cfg < ' + input_file + " > subcode/output.txt";
            if (checker) {
                str = 'sudo ./nsjail/nsjail --config nsjail/configs/pythonchecker' + time_suffix + '.cfg < ' + input_file
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
            str = 'sudo ./nsjail/nsjail --config nsjail/configs/java' + time_suffix + '.cfg < ' + input_file + " > subcode/output.txt";
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
    console.log(end, start, rt);
    return payload;
}
async function compileTests(problem) { // not in use
    let loc = "../problems/" + problem.id;
    fs.readdir(loc, (err, files) => {
        for (i in files) {
            fs.writeFileSync(loc + "/sol/" + i, runCode(i, problem.lang, code, problem.tl, problem.ml).output);
        }
    });
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
                console.log(loc + i);
                let outputfull;
                let output;
                let compError = false
                for (let iterations = 0; iterations < 2; iterations++) {
                    rerun = false;
                    outputfull = await runCode(loc + i, language, userCode, tl, ml, true)
                    await timeout(100);
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
                await timeout(100);
                juryAnswer = juryAnswer.output;
                console.log("Timing:");
                console.log(maxtime, outputfull.time);
                if (juryAnswer.includes("run time >= time limit")) {
                    console.log("Checker timeout error");
                    payload.verdict = "ERROR";
                    payload.output = "System Error: checker timed out";
                    payload.runtime = maxtime;
                    solved = false;
                    await timeout(500);
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
                    await timeout(250);
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
                await timeout(250);
                res(payload);
            }
        });
    });
}
async function addProblem(pid, tl, ml, checker) { // not in use
    let loc = "../problems/" + pid;
    fs.writeFileSync(loc + "/checker.cpp", checker);
    add(pid, tl, ml);
}

module.exports = {
    run: (problem, submit) => {
        return run(problem, submit);
    },
    compileTests: (problem) => {
        return compileTests(problem);
    },
    addTests: (problem, tid, test, out) => {
        return addTests(problem, tid, test, out);
    },
    addChecker: (pid, code) => {
        return addChecker(pid, code);
    }
}
