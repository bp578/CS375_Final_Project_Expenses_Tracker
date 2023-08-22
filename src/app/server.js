let express = require("express");
let { Pool } = require("pg");
let argon2 = require("argon2");
let cookieParser = require("cookie-parser");
let crypto = require("crypto");

let env;
try {
    env = require("../../env.json");
} catch (err){
    env = require("../../env_temp.json");
};

let hostname = "localhost";
let port = 3000;
let app = express();
let pool = new Pool(env);

app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.use(cookieParser());

pool.connect().then(() => {
    console.log(`Connected to database: ${env.database}`);
});

let tokenStorage = {};

function isValidToken(req, res, next){
    let { token } = req.cookies;
    if (tokenStorage.hasOwnProperty(token)) {
        next();
    } else {
        return res.status(400).json({error: "Invalid Token"})
    }
}

let cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
};

// Account Creation and Validation
app.post('/create', async (req, res) => {
    let user = req.body["user"];
    let pass = req.body["pass"];
    let re = req.body["re"];

    console.log("New Account Info:", req.body);

    if ((user === '') || (pass === '') || (re === '')) {
        return res.status(400).json({ error: "One or more entries is missing!" });
    };

    if (pass !== re) {
        return res.status(400).json({ error: "Passwords do not match. Please re-enter password" });
    };

    if (user.length >= 50 || pass.length >= 50) {
        return res.status(400).json({ error: "Username or pass is longer than 50 characters" });
    };

    let hash;
    try {
        hash = await argon2.hash(pass);
    } catch (error) {
        console.log("HASH FAILED:", error);
        return res.status(500).json({ error: "Failed to Hash password" });
    };

    console.log("Hash:", hash);
    // Check if the username already exist
    pool.query(
        `SELECT 1 FROM accounts WHERE username = $1`, [user]
    ).then(result => {
        if (result.rowCount >= 1) {
            return res.status(400).json({ error: "Username already exist. Please use another username" });
        } else {
            // Create new account if is doesnt exists already
            pool.query(
                `INSERT INTO accounts (username, password) VALUES ($1, $2) RETURNING *`, [user, hash]
            ).then(result => {
                console.log("Inserted:");
                console.log(result.rows);

                // Create a table of expenses tied to a user
                assignTableToUser(user);

                return res.status(200).json({ success: "Account has been successfully created. Please return to the login menu to login" });
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

    if (user === '' || pass === '') {
        return res.status(400).json({ error: "One or more entries is missing. Unsuccessful login" })
    };

    let queryRes;
    try {
        queryRes = await pool.query(`SELECT password FROM accounts WHERE username = $1`, [user]);
    } catch (error) {
        console.log("QUERIED FAILED:", error);
        return res.status(500).json({ error: "QUERIED FAILED" });
    };

    if (queryRes.rowCount === 0) {
        return res.status(500).json({ error: "Username does not exist" });
    };

    let hash = queryRes.rows[0].password;
    let verifyResult;
    try {
        verifyResult = await argon2.verify(hash, pass);
    } catch (error) {
        console.log("VERIFYING FAILED", error);
        return res.status(500).json({ error: "VERIFY FAILED" });
    };

    if (!verifyResult) {
        console.log("Credentials didn't match");
        return res.status(400).json({ error: "Incorrect Password" });
    } else {
        let token = crypto.randomBytes(32).toString("hex");
        tokenStorage[token] = user;
        console.log("Login attempt Successful:", req.query);
        return res.cookie("token", token, cookieOptions).json({ url: `http://${hostname}:${port}/land.html` });
    };
});

function assignTableToUser(user) {
    pool.query(
        `CREATE TABLE ${user} (
            transaction_id INT PRIMARY KEY,
            date DATE,
            transaction_name VARCHAR(50),
            category VARCHAR(50),
            amount INT
         )`
    ).then(result => {
        console.log(`Table has been created for user: ${user}`);
    }).catch(error => {
        console.log(`Could not make table for user: ${user}`)
        console.log(error);
    });
}

// Adding/Deleting Expenses
app.post('/add', (req, res) => {
    let body = req.body;
    let user = body.user;
    let transaction = body.transaction;
    let date = body.date;
    let category = body.category;
    let amount = body.amount;

    if (!addRequestIsValid(body)) {
        return res.status(400).json({ error: "Error with query parameters" });
    }

    pool.query(
        `INSERT INTO ${user}(date, transaction_name, category, amount) VALUES($1, $2, $3, $4) RETURNING *`,
        [date, transaction, category, amount]
    ).then((result) => {
        console.log("Inserted: ");
        console.log(result.rows);
    }).catch((error) => {
        console.log(`Error: Cannot add expenses to user `);
        console.log(error);
        return res.status(500).send();
    })

    //Add to database once that is implemented. Return an empty json body for now. 
    return res.status(200).send();

});

//Validation
function addRequestIsValid(body) {
    if (!body.transaction || !body.date || !body.user || !body.category || !body.amount) {
        return false;
    }
    //Any name and category is valid for now. Maybe add a list of all valid categories later?
    return (Number.isFinite(Number.parseInt(body.amount))) && isValidSQLDateFormat(body.date) && userExists(body.user);
}

function isValidSQLDateFormat(dateString) {
    const pattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!pattern.test(dateString)) {
        return false;
    }

    const dateComponents = dateString.split('-');
    const year = parseInt(dateComponents[0], 10);
    const month = parseInt(dateComponents[1], 10);
    const day = parseInt(dateComponents[2], 10);

    // Create a Date object and validate its components
    const dateObject = new Date(year, month - 1, day);
    return (
        dateObject.getFullYear() === year &&
        dateObject.getMonth() === month - 1 &&
        dateObject.getDate() === day
    );
}

async function userExists(user) {
    try {
        const result = await pool.query(
            `SELECT 1 FROM accounts WHERE username = $1`, [user]
        );

        if (result.rowCount >= 1) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.log("Error with validating user");
        console.log(error);
        return false;
    }
}

app.get("/logout", async (req, res) => {
    let { token } = req.cookies;

    if (token === undefined) {
        console.log("Already logged out");
        return res.status(400).json({error: "Already logged out"});
    }
    if (!tokenStorage.hasOwnProperty(token)) {
        console.log("Token doesn't exist");
        return res.status(400).json({error: "Token does not exist"});
    }
    delete tokenStorage[token];
    console.log("Logout successful");
    return res.clearCookie("token", cookieOptions).json({url: `http://${hostname}:${port}`});
});

app.listen(port, hostname, () => {
    console.log(`Connecting to: http://${hostname}:${port}`);
});
