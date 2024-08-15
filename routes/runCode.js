const execSync = require('child_process').execSync;
const fs = require('fs');
const {
    add
} = require("./sql");

async function addTests(pid, tid, test, out) {
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
async function addChecker(pid, code) {
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
async function runCode(input_file, lang, solution, compile, extended, checker = false) {
    let output = ''
    let start = 0;
    let end = -1;
    if (lang == 'cpp') {
        fs.writeFileSync('subcode/test.cpp', solution);
        try {
            str = 'sudo ./nsjail/nsjail --config nsjail/configs/executable.cfg < ' + input_file + " > subcode/output.txt";
            if (compile) {
                output = execSync("g++ -o subcode/a.out subcode/test.cpp", {
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
            str = 'sudo ./nsjail/nsjail --config nsjail/configs/python.cfg < ' + input_file + " > subcode/output.txt";
            if (checker) {
                str = 'sudo ./nsjail/nsjail --config nsjail/configs/pythonchecker.cfg < ' + input_file
            }
            start = performance.now();
            output = execSync(str, {
                encoding: 'utf-8'
            });
            end = performance.now();
        } catch (error) {
            console.log("Eror when trying to run Python code:", error);
            payload = {
                output: error['stderr'],
                time: -1
            }
            return payload;
        }
    } else if (lang == 'java') {
        fs.writeFileSync('subcode/test.java', solution);
        try {
            str = 'sudo ./nsjail/nsjail --config nsjail/configs/java.cfg < ' + input_file + " > subcode/output.txt";
            output = execSync("javac subcode/test.java", {
                encoding: 'utf-8'
            });
            start = performance.now() + 1200; // scuffed fix because of how java works
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
            fs.writeFileSync(loc + "/sol/" + i, runCode(i, problem.lang, code, true, false).output);
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
        let solved = true;
        let compile = true;
        fs.readdir(loc, async (err, files) => {
            if (err) {
                console.log("Error in run:", err);
                return;
            }
            let testnum = 0;
            let extended = false;
            if (problem.id == 30 || problem.id == 26) { // implement custom time limit later, replace extended with actual time limit
                extended = true;
            }
            for (_ in files) {
                i = files[_]
                console.log(loc + i);
                let outputfull;
                let output;
                let compError = false
                for (let iterations = 0; iterations < 3; iterations++) {
                    rerun = false;
                    outputfull = await runCode(loc + i, language, userCode, compile, extended)
                    await timeout(100);
                    output = outputfull.output;
                    if (outputfull.time > maxtime) maxtime = outputfull.time;
                    if (outputfull.time == -1) {
                        solved = false;
                        payload.verdict = "Compilation/Runtime Error"
                        if (output.includes("run time >= time limit")) {
                            rerun = true;
                            payload.verdict = "Time Limit Exceeded"
                            if (language == 'cpp') maxtime = 1000; // implement custom time limit later
                            else if (language == 'java') maxtime = 2000;
                            else if (language == 'python') maxtime = 3000;
                        } else if (output.includes("MemoryError") || output.includes("StackOverflowError")) {
                            payload.verdict = "Memory Limit Exceeded"
                            rerun = true;
                        }
                        payload.tl = maxtime
                        output = output.replace(/^\[I\].*/gm, '');
                        output = output.trim()
                        payload.output = output
                        console.log("Error in compilation")
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
                juryAnswer = await runCode("subcode/args.txt", "python", checkerCode, true, extended, true);
                await timeout(100);
                juryAnswer = juryAnswer.output;
                console.log("Timing:");
                console.log(maxtime, outputfull.time);
                if (juryAnswer.includes("run time >= time limit")) {
                    console.log("Checker timeout error");
                    payload.verdict = "ERROR";
                    payload.output = "System Error: checker timed out";
                    payload.tl = maxtime;
                    solved = false;
                    await timeout(500);
                    res(payload);
                    break;
                }
                if (!(juryAnswer.trim() === "AC" || juryAnswer.trim() === "Accepted")) {
                    payload.verdict = "Wrong Answer";
                    if (testnum < 1) {
                        payload.output = juryAnswer;
                    } else {
                        payload.output = "Viewing as admin:\n" + juryAnswer;
                    }
                    payload.tl = maxtime;
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
                payload.tl = maxtime;
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
