require('dotenv').config();
const express = require('express');
const router = express.Router({ mergeParams: true });
const {compileTests} = require("./runCode");


router.post("/addTest", (req, res)=> {
	res.redirect("/");
});

router.post("/status", (req, res)=> {
	res.redirect("/");
});
router.get("/test", (req, res)=> {
	let problem = {"id":5};
	compileTests(problem, 0);
	res.send("SDFSDF");
});
module.exports = router;
