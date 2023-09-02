let express = require("express");
let { Pool } = require("pg");
let argon2 = require("argon2");
let cookieParser = require("cookie-parser");
let crypto = require("crypto");
let multer = require('multer');
let fs = require('fs');
let upload = multer({ dest: 'uploads/' });

let env;
try {
    env = require("../../env.json");
} catch (err) {
    env = require("../../env_temp.json");
};

let hostname = "localhost";
let port = 3000;
let app = express();
let pool = new Pool(env);
app.use(cookieParser());

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
        console.log("Valid Token!")
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
                assignRecurringTableToUser(user);

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
            transaction_id SERIAL PRIMARY KEY,
            date DATE,
            transaction_name VARCHAR(50),
            category VARCHAR(50),
            amount INT
         )`
    ).then(result => {
        console.log(`Table has been created for user: ${user}`);
    }).catch(error => {
        console.log(`Could not make table for user: ${user}`);
        console.log(error);
    });
}

function assignRecurringTableToUser(user){
    pool.query(
        `CREATE TABLE ${user}_recurring (
            transaction_id SERIAL PRIMARY KEY,
            transaction_name VARCHAR(50),
            category VARCHAR(50),
            amount INT,
            frequency VARCHAR(10)
         )`
    ).then(result => {
        console.log(`Recurring Payments Table has been created for user: ${user}`);
    }).catch(error => {
        console.log(`Could not make recurring payment table for user: ${user}`)
        console.log(error);
    });
}

// Get all expenses from a user
app.get("/expenses", isValidToken, (req, res) => {
    let { token } = req.cookies;
    let user = tokenStorage[token];
    // console.log(`TOKEN: ${token}`);
    // console.log(`USERNAME FROM COOKIE: ${user}`);
    pool.query(`SELECT * FROM ${user}`).then(result => {
        console.log(`Displaying all expenses for user: ${user}`);
        // console.log(result.rows);
        return res.status(200).json({ rows: result.rows });
    }).catch(error => {
        console.log(`Error initializing table for user: ${user}`);
        console.log(error);
        return res.status(500).send();
    });
});

//Adding Expenses manually
// Adding Expenses
app.post('/add', isValidToken, (req, res) => {
    let { token } = req.cookies;
    let user = tokenStorage[token];
    let body = req.body;
    let transaction = body.transaction;
    let date = body.date;
    let category = body.category;
    let amount = body.amount;

    if (!addRequestIsValid(body)) {
        return res.status(400).json({ error: "Error with query parameters" });
    }

    addExpenseToDatabase(user, date, transaction, category, amount);

    return res.status(200).send();

});

//Add expenses from CSV file
app.post('/upload', isValidToken, upload.single('csvFile'), (req, res) => {
    let { token } = req.cookies;
    let csvFilePath = req.file.path;
    let csvContent = fs.readFileSync(csvFilePath, 'utf8');
    let user = tokenStorage[token];

    if (!req.file) {
        return res.status(400).send('Error: No File Uploaded');
    }

    if (!user) {
        return res.status(400).send('Error: User missing');
    }

    const csvRows = csvContent.split('\n');
    const headers = csvRows[0].split(',');

    if (!headerIsValid(headers)) {
        return res.status(400).send("Error: headers are not in this order: date,transaction_name,category,amount. Check spelling and whitespace.")
    }

    for (let rowIndex = 1; rowIndex < csvRows.length; rowIndex++) {
        let values = csvRows[rowIndex].split(',');

        if (!addRequestIsValid({ transaction: values[1], date: values[0], category: values[2], amount: values[3] })) {
            return res.status(400).send("Error: A value in your rows is not a valid value");
        }

        //await addExpenseToDatabase(user, values[0], values[1], values[2], values[3]);
    }

    res.status(200).send("File upload successful");
});

async function addExpenseToDatabase(user, date, transaction, category, amount) {
    pool.query(
        `INSERT INTO ${user} (date, transaction_name, category, amount) VALUES($1, $2, $3, $4) RETURNING *`,
        [date, transaction, category, amount]
    ).then((result) => {
        console.log("Inserted: ");
        console.log(result.rows);
    }).catch((error) => {
        console.error(`Error: Cannot add expenses to user ${user}`);
        console.error(error);
        throw error; // Rethrow the error to be caught by the calling function
    })
}

//Validation
function addRequestIsValid(body) {
    let categories = ["Food/Drink", "Entertainment", "Housing", "Utilities", "Groceries", "Transportation", "Clothing", "Education", "Healthcare", "Gifts", "Travel", "Misc"];

    if (!body.transaction || !body.date || !body.category || !body.amount) {
        return false;
    }
    //Any name and category is valid for now. Maybe add a list of all valid categories later?
    return (Number.isFinite(Number.parseFloat(body.amount))) && isValidSQLDateFormat(body.date) && userExists(body.user) && categories.includes(body.category);
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
};

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

function headerIsValid(header) {
    return JSON.stringify(header) === JSON.stringify(["date", "transaction_name", "category", "amount"]);
}

app.post("/add_recurring",isValidToken, async (req, res) => {
    let {transaction, category, amount, frequency } = req.body;
    let { token } = req.cookies;
    let user = tokenStorage[token];

    try {
        let response = await pool.query(`SELECT 1 FROM ${user}_recurring WHERE transaction_name = $1`, [transaction])
        if (response.rowCount >= 1){
            return res.status(400).json({error: `The recurring payment ${transaction} already exists`})
        }
    } catch (error) {
        console.log(error);
    }

    try {
        let response = await pool.query(`INSERT INTO ${user}_recurring (transaction_name, category, amount, frequency) VALUES($1, $2, $3, $4) RETURNING *`,
        [transaction, category, amount, frequency]);
        console.log("Rows Inserted:", response.rows);
        return res.status(200).json({"success": true});
    } catch (error){
        console.log(error);
        return res.status(400).json({"success": false});
    }
})

app.post("/deleteRecurring", isValidToken, async (req, res) => {
    let { transaction } = req.body;
    let { token } = req.cookies;
    let user = tokenStorage[token];
    console.log(transaction);

    try {
        let query  = await pool.query(`DELETE FROM ${user}_recurring WHERE transaction_name = $1`, [transaction]);
        console.log(query.rowCount);
        if (query.rowCount >= 1){
            return res.json({msg: `${transaction} has been deleted`})
        } else {
            return res.json({msg: `${transaction} does not exists. Not deleted`});
        }
    } catch (error){
        console.log(error);
    }
});

app.get("/refresh", isValidToken, async (req, res) => {
    let { token } = req.cookies;
    let user = tokenStorage[token];

    let uniqueItems;
    try {
        let query = await pool.query(`SELECT DISTINCT ON (transaction_name) transaction_name FROM ${user}`)
        uniqueItems = query.rows;
    } catch (error){
        console.log(error);
    }

    try {
        for (let item of uniqueItems){
            let query = await pool.query(`SELECT * FROM ${user} WHERE transaction_name = $1 LIMIT 4`, [item["transaction_name"]]);
            let totalDays = 0;
            for (let row of query.rows){
                let previousDate = new Date(0,0,0);
                console.log(row['date']);
                let days = Math.abs(row["date"].getTime() - previousDate.getTime());
                let NumOfDays = Math.floor(days / (1000 * 3600 * 24));
                previousDate = row["date"];
                totalDays += days;

                console.log(NumOfDays);
            }
        }
    } catch (error){
        console.log(error);
    }
});

app.get("/recurring", isValidToken, (req, res) => {
    let { token } = req.cookies;
    let user = tokenStorage[token];
    // console.log(`TOKEN: ${token}`);
    // console.log(`USERNAME FROM COOKIE: ${user}`);
    pool.query(`SELECT * FROM ${user}_recurring`).then(result => {
        console.log(`Displaying all recurring payments for user: ${user}`);
        // console.log(result.rows);
        return res.status(200).json({ rows: result.rows });
    }).catch(error => {
        console.log(`Error initializing table for user: ${user}`);
        console.log(error);
        return res.status(500).send();
    });
});

app.get("/logout", async (req, res) => {
    let { token } = req.cookies;

    if (token === undefined) {
        console.log("Already logged out");
        return res.status(400).json({ error: "Already logged out" });
    }
    if (!tokenStorage.hasOwnProperty(token)) {
        console.log("Token doesn't exist");

        return res.status(400).json({ error: "Token does not exist" });
    }
    delete tokenStorage[token];
    return res.clearCookie("token", cookieOptions).json({ url: `http://${hostname}:${port}` });
});

app.listen(port, hostname, () => {
    console.log(`Connecting to: http://${hostname}:${port}`);
});