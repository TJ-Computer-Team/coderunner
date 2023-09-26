const execSync = require('child_process').execSync;
const fs = require('fs');
const {add, testSql} = require("./sql");

const axios = require('axios');
async function addTests(pid, tests){
	console.log("INTERESTING");
	let loc = "../problems/"+pid;
	console.log(pid, tests)
	console.log("here is loc");
	console.log(loc);
	if (!fs.existsSync(loc+pid)){
		fs.mkdirSync(loc+"/sol", { recursive: true });
	}
	if (!fs.existsSync(loc+pid)){
		fs.mkdirSync(loc+"/test", { recursive: true });
	}
	for(let i = 0; i<tests.length; i++){
		fs.writeFileSync(loc+"/test/"+i, tests);
	}
}
async function runCode(input_file, lang, solution){
	let output = ''
	console.log(lang);
	if (lang== 'cpp') {
		fs.writeFileSync('subcode/test.cpp', solution);
		//write to correct file for code
		//output = execSync('test.in<sudo ./nsjail/nsjail --config nsjail/configs/executable.cfg', { encoding: 'utf-8' });  //pipe input into this
	}
	else if (lang== 'python') {
		console.log("running python\n" + solution);
		fs.writeFileSync('subcode/hello.py', solution);
		try {
			str = 'sudo ./nsjail/nsjail --config nsjail/configs/python.cfg < '+input_file
			output = execSync(str, { encoding: 'utf-8' });
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
	return output;
}
async function compileTests(problem){
	let loc = "../problems/"+problem.id;
	console.log(problem.id);
        console.log(problem);
	fs.readdir(loc, (err, files)=> {
		for(i in files){
			fs.writeFileSync(loc+"/sol/"+i, runCode(i, problem.lang, code));
		}
	});
}

async function run(problem, submit) {
	let loc = "../problems/"+problem.id+"/test/";
        let loc2 = "../problems/"+problem.id+"/sol/";
	let checkid = problem.checkid;
        let tl = problem.tl;
        let ml = problem.ml;
        let userCode = submit.code;
        let language = submit.language;

        let output = undefined, fverdict = "AC"
	checkerCode = fs.readFileSync(loc2+"/checker.cpp", {encoding:'utf8', flag:'r'})
	console.log(checkerCode);
	console.log(loc)
	fs.readdir(loc, async (err, files)=> {
		for(i in files){
			console.log(loc+i);
			output = await runCode(loc+i, language, userCode)
			console.log("output was", output)
			//juryAnswer = await runCode(loc+i, language, checkerCode);

			/*
			fs.writeFileSync('test.in', output);
			fs.writeFileSync('test.out', tests[i].ans);
			fverdict = runCode(i, "c++", checkerCode)
			if (fverdict!="AC") {
				break;
			}
			*/
		}
	});

	return fverdict
}
async function addProblem(pid, tl, ml, checker){
	let loc = "../problems/"+pid;
	fs.writeFileSync(loc+"/checker.cpp", checker);
	add(pid, tl, ml);
}

module.exports = {
        run: (problem, submit) => {
                return run(problem, submit);
        },
        compileTests: (problem) => {
                return compileTests(problem);
        },
        addTests: (problem, tests) => {
                return addTests(problem, tests);
        }
}
