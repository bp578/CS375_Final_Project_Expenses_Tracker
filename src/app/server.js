let express = require("express");
let { Pool } = require("pg");

let env = require("../../env.json");
let hostname = "localhost";
let port = 3000;
let app = express();
let pool = new Pool(env);

app.use(express.static("public"));
app.use(express.json());
pool.connect().then(() => {
    console.log(`Connected to database: ${env.database}`);
});

app.post('/create', (req,res) => {
    let user = req.body["user"];
    let pass = req.body["pass"];
    let re = req.body["re"];

    console.log("New Account Info:", req.body);

    if ((user === '') || (pass === '') || (re === '')){
        return res.status(400).json({error: "One or more entries is missing!"});
    };
    
    if (pass !== re){
        return res.status(400).json({error: "Passwords do not match. Please re-enter password"});
    };

    if (user.length >= 15 || pass.length >= 15){
        return res.status(400).json({error: "Username or pass is longer than 15 characters"});
    };

    // Check if the username already exist
    pool.query(
        `SELECT 1 FROM accounts WHERE username = $1`, [user]
        ).then(result => {
            if (result.rowCount >= 1){
                res.status(400).json({error: "Username already exist. Please use another username"});
            } else {
                // Create new account if is doesnt exists already
                pool.query(
                    `INSERT INTO accounts (username, pass) VALUES ($1, $2) RETURNING *`, [user, pass]
                    ).then(result => {
                        console.log("Inserted:");
                        console.log(result.rows);
                        res.json({success: "Account has been successfully created. Please return to the login menu to login"});
                    }).catch(error => {
                        console.log("Could not add new account:");
                        console.log(error);
                    });
            };
        }).catch(error => {
            console.log("Verifying existing user failed:");
            console.log(error);
        });
});

app.get(`/login`, (req, res) => {
    let user = req.query.user;
    let pass = req.query.pass;

    console.log("Login attempt:", req.query);

    if (user === '' || pass === ''){
        return res.status(400).json({error: "One or more entries is missing. Unsuccessful login"})
    };

    pool.query(
        `SELECT 1 FROM accounts WHERE username = $1 AND pass = $2`, [user, pass]
        ).then(result => {
            if (result.rowCount >= 1){
                res.json({url: `http://${hostname}:${port}/land.html`});
            } else {
                res.status(400).json({error: "Incorrect username and password. Please try again"});
            };
        });
});

app.listen(port, hostname, () => {
    console.log(`Connecting to: http://${hostname}:${port}`);
});
