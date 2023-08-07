let express = require("express");
let { Pool } = require("pg");

let env = require("../../env.json");
let hostname = "localhost";
let port = 3000;
let app = express();
let pool = new Pool();

app.use(express.static("src/app/public"));
app.use(express.json());

app.post('/create', (req,res) => {
    console.log(req.body);
    let user = req.body["user"];
    let pass = req.body["pass"];
    let re = req.body["re"];

    if ((user === '') || (pass === '') || (re === '')){
        return res.status(400).json({error: "One or more entries is missing!"});
    }
    
    if (pass !== re){
        return res.status(400).json({error: "Passwords do not match. Please re-enter password"});
    };

    res.json({success: "Account has been successfully added. Please return to the login menu"});
});

app.get(`/login`, (req, res) => {
    let user = req.query.user;
    let pass = req.query.pass;
    console.log(req.query);

    if (user === '' || pass === ''){
        return res.status(400).json({error: "One or more entries is missing. Unsuccessful login"})
    };

    res.status(304).redirect('/land.html');
});

app.listen(port, hostname, () => {
    console.log(`Connecting to http://${hostname}:${port}`);
});
