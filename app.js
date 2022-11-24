require('dotenv').config();
const express = require("express");
const codRouter= require("./routes/handle");
const app = express();
const port = 8080;

const axios = require('axios');


app.use(express.urlencoded({ extended: true}));

app.get("/run", async (req, res) => {
    console.log("IT WORKED");

    //make this post and run code here, return verdict. still do queueing in the main vm


    res.send("WOW THIS IS A RESPONSE");
});

app.use("/", codRouter);
async function makeReq() {
await axios.get('http://10.202.0.2/')
    .then(res => {
        console.log(res);
    }).catch((error) => {
        console.log(error);
    });
}

//makeReq();


console.log("start");
app.listen(port);
