let express = require("express");
let { Pool } = require("pg");
let argon2 = require("argon2");
let cookieParser = require("cookie-parser");
let crypto = require("crypto");

let env = require("../../env.json");
let hostname = "localhost";
let port = 3000;
let app = express();
let pool = new Pool(env);

app.use(express.static(__dirname + "/public"));
app.use(express.json());
pool.connect().then(() => {
    console.log(`Connected to database: ${env.database}`);
});

let tokenStorage = {};

function verifyToken(token){
    try {
        if (tokenStorage[token]){
            return tokenStorage[token];
        }
    } catch (error) {
        return error;
    }
}

let cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
};

app.post('/create', async (req,res) => {
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

    if (user.length >= 50 || pass.length >= 50){
        return res.status(400).json({error: "Username or pass is longer than 50 characters"});
    };

    let hash;
    try {
        hash = await argon2.hash(pass);
    } catch (error) {
        console.log("HASH FAILED:", error);
        return res.status(500).json({error: "Failed to Hash password"});
    };

    console.log("Hash:", hash);
    // Check if the username already exist
    pool.query(
        `SELECT 1 FROM accounts WHERE username = $1`, [user]
        ).then(result => {
            if (result.rowCount >= 1){
                return res.status(400).json({error: "Username already exist. Please use another username"});
            } else {
                // Create new account if is doesnt exists already
                pool.query(
                    `INSERT INTO accounts (username, password) VALUES ($1, $2) RETURNING *`, [user, hash]
                    ).then(result => {
                        console.log("Inserted:");
                        console.log(result.rows);
                        return res.json({success: "Account has been successfully created. Please return to the login menu to login"});
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

app.get(`/login`, async (req, res) => {
    let user = req.query.user;
    let pass = req.query.pass;

    console.log("Login attempt:", req.query);

    if (user === '' || pass === ''){
        return res.status(400).json({error: "One or more entries is missing. Unsuccessful login"})
    };

    let queryRes;
    try {
        queryRes = await pool.query(`SELECT password FROM accounts WHERE username = $1`, [user]);
    } catch (error){
        console.log("QUERIED FAILED:", error);
        return res.status(500).json({error: "QUERIED FAILED"});
    };

    if (queryRes.rowCount === 0){
        return res.status(500).json({error: "Username does not exist"});
    };

    let hash = queryRes.rows[0].password;
    let verifyResult;
    try {
        verifyResult = await argon2.verify(hash, pass);
    } catch (error) {
        console.log("VERIFYING FAILED", error);
        return res.status(500).json({error: "VERIFY FAILED"});
    };

    if (!verifyResult) {
        console.log("Credentials didn't match");
        return res.status(400).json({error: "Incorrect Password"});
    } else {
        let token = crypto.randomBytes(32).toString("hex");
        tokenStorage[token] = user;
        console.log(tokenStorage);
        return res.cookie("token", token, cookieOptions).json({url: `http://${hostname}:${port}/land.html`});
    };
});

app.get("/logout", (req, res) => {
    res.send();
});

app.listen(port, hostname, () => {
    console.log(`Connecting to: http://${hostname}:${port}`);
});