const execSync = require('child_process').execSync;
const fs = require('fs');

const axios = require('axios');


async function compileTests(problem, tests){
	console.log(problem.id);
	let loc = "../problems/"+problem.id;
	if (!fs.existsSync(loc+problem.id)){
		fs.mkdirSync(loc+"/sol", { recursive: true });
	}
	if (!fs.existsSync(loc+problem.id)){
		fs.mkdirSync(loc+"/test", { recursive: true });
	}
        console.log(problem);
        let solution = problem.sol;
        let lang = problem.lang;
	let lst = [];
	for(let i = 0; i<tests.length; i++){
		fs.writeFileSync('test.in', tests[i].test); //maybe get rid of this?
		fs.writeFileSync(loc+"/test/"+i, tests[i].test);
		console.log("tests", tests[i].test);
		let output = ''
		if (lang== 'cpp') {
			fs.writeFileSync('subcode/test.cpp', solution);
			//write to correct file for code
			//output = execSync('test.in<sudo ./nsjail/nsjail --config nsjail/configs/executable.cfg', { encoding: 'utf-8' });  //pipe input into this
		}
		else if (lang== 'python') {
			console.log(solution);
			console.log("running python");
			fs.writeFileSync('subcode/hello.py', solution);
			try {
				output = execSync('sudo ./nsjail/nsjail --config nsjail/configs/python.cfg < test.in', { encoding: 'utf-8' });
			}
			catch (error) {
				console.log("ERROR", error);
			}
			console.log("output was", output);
		}
		else if (lang== 'java') {
			fs.writeFileSync('subcode/test.java', solution);
			output = execSync('sudo ./nsjail/nsjail --config nsjail/configs/java.cfg', { encoding: 'utf-8' });  
		}
		fs.writeFileSync(loc+"/sol/"+i, output);
	}
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
function grabTests(task){
	return [1, 2]
}
function grabChecker(cid){
}
async function run(problem, submit) {
	let loc = "../problems/"+problem.id;
        let tests = await grabTests(task)
        let checkid = problem.checkid;
        let tl = problem.tl;
        let ml = problem.ml;
        let userCode = submit.code;

        let language = submit.language;

        let output = undefined, fverdict = "AC"

        for(let i = 0; i<tests.length; i++){
                let verdict = undefined;
                fs.writeFileSync('test.in', tests[i].test);
                if (language == 'cpp') {
                        fs.writeFileSync('subcode/test.cpp', userCode);
                        //write to correct file for code
                        let wow = execSync('g++ subcode/test.cpp');
                        output = execSync('sudo ./nsjail/nsjail --config nsjail/configs/executable.cfg < test.in', { encoding: 'utf-8' });  //pipe input into this
                }
                else if (language == 'python') {
                        console.log("running python");
                        fs.writeFileSync('subcode/hello.py', userCode);
                        try {
                                //output = await execSync('sudo ./nsjail/nsjail --config nsjail/configs/python.cfg > test.in', { encoding: 'utf-8' });
                                //JOHNNY I CHNGED UR CODE CUZ IT WOULDNT COMPILE SRY
                                output = execSync('sudo ./nsjail/nsjail --config nsjail/configs/python.cfg < test.in', { encoding: 'utf-8' });
                        }
                        catch (error) {
                                console.log("ERROR", error);
                        }

                }
                else if (language == 'java') {
                        fs.writeFileSync('test.java', userCode);
                        output = execSync('sudo ./nsjail/nsjail --config nsjail/configs/java.cfg', { encoding: 'utf-8' });  
                }
                console.log("output was", output);
		/**
                fs.writeFileSync('test.in', output);
                fs.writeFileSync('test.out', tests[i].ans);
                let check= grabChecker(checkid);
                let ccode = check.code;
                let lang= check.lang;
                if (lang== 'cpp') {
                        fs.writeFileSync('subcode/test.cpp', ccode);
                        let wow = execSync('g++ subcode/test.cpp');
                        //write to correct file for code
                        output = execSync('sudo ./nsjail/nsjail --config nsjail/configs/executable.cfg', { encoding: 'utf-8' });  //pipe input into this
                }
                else if (lang== 'python') {
                        console.log(solution);
                        console.log("running python");
                        fs.writeFileSync('subcode/hello.py', ccode);
                        output = execSync('sudo ./nsjail/nsjail --config nsjail/configs/python.cfg < test.in', { encoding: 'utf-8' });
                        //updateTestSol(tests[i].id, output);
                }
                else if (lang== 'java') {
                        fs.writeFileSync('test.java', ccode);
                        output = execSync('sudo ./nsjail/nsjail --config nsjail/configs/java.cfg', { encoding: 'utf-8' });  
                }
                if(!output.includes("AC")){
                        console.log("WRONG", output);
                        console.log("CHECKER IS ", check);
                        fverdict = "WA";
                        break;
                }
		**/
        }

        //checker = undefined;
        userCode = undefined;
        //input = undefined;
	return fverdict
}

module.exports = {
        run: (pid, sid) => {
                return queue(pid, sid);
        },
        compileTests: (problem, tests) => {
                return compileTests(problem, tests);
        }
}
