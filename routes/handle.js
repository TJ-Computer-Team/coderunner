require('dotenv').config();
const express = require('express');
const router = express.Router({ mergeParams: true });
const {compileTests, run} = require("./runCode");


router.post("/addTest", (req, res)=> {
	res.redirect("/");
});

router.post("/status", async (req, res) => { //eventually change to post to submit
        //sends file to another website

});

router.get("/test", (req, res)=> {
	let problem = {"id":5};
	compileTests(problem, 0);
	res.send("SDFSDF");
});
module.exports = router;
