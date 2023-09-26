require('dotenv').config();
const express = require("express");
const app = express();
const port = 8080;
const {compileTests, run, addTests} = require("./routes/runCode");

const axios = require('axios');


app.use(express.urlencoded({ extended: true}));


app.get("/wow", async (req, res) => {
	console.log("hi!");
	res.send("WOW");
});

app.post("/addTest", async (req, res) => {
	console.log("INTERESTINSDSDFSDFG");
	console.log(req.body)
	addTests(req.body.pid, req.body.test)
	res.send("nice")
});

app.post("/run", async (req, res) => {
	console.log("IT WORKED");
	console.log(req.body);
	let language = req.body.lang;
	//console.log(language);
	if (language != 'python' && language != 'cpp' && language != 'java') {
		console.log("bad");
		res.send("unacceptable code language");
		return;
	}

	let pid = req.body.problemid;
	if(pid ==""){
		res.send("You didn't select an actual problem :O");
		return;
	}
	let file = req.body.code;
	code = {"code": req.body.code, "language":language}
	problem = {"id": parseInt(pid), "tl" : 1000, "ml" : 1000, "checkid": 1}
	console.log(problem);
	result= await run(problem, code);
	console.log("YA");
	console.log(result);
	res.send(result)
	//make this post and run code here, return verdict. still do queueing in the main vm
});


//makeReq();


console.log("start");
app.listen(port);
