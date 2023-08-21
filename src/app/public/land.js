let transactionName = document.getElementById("transaction");
let transactionDate = document.getElementById("date");
let transactionCategory = document.getElementById("category");
let transactionAmount = document.getElementById("amount");
let expenses = document.getElementById("expenses");
let addButton = document.getElementById("add");
let params = new URLSearchParams(window.location.search);
let username = params.get("user");
let welcome = document.getElementById("welcome");

addButton.addEventListener('click', addTransaction);
welcome.textContent = `Welcome, ${username}`;


updateTable();

//Add expenses from database to table when user logs in
function updateTable() {
    fetch(`/expenses?user=${username}`).then(response => {
        console.log("Updating table...")
        console.log(response.status);
        return response.json();
    }).then(data => {
        let rows = data.rows;
        console.log(data.rows);
        if (rows) {
            expenses.textContent = '';
            for (let row of rows) {
                let tableRow = document.createElement("tr");
                let idData = document.createElement("td");
                let nameData = document.createElement("td");
                let dateData = document.createElement("td");
                let categoryData = document.createElement("td");
                let amountData = document.createElement("td");

                //Initialize data
                idData.textContent = row["transaction_id"];
                nameData.textContent = row["transaction_name"];
                dateData = row["date"].slice(0, 10);
                categoryData.textContent = row["category"];
                amountData.textContent = `$${row["amount"]}`;

                //Add data to row
                tableRow.append(idData);
                tableRow.append(nameData);
                tableRow.append(dateData);
                tableRow.append(categoryData);
                tableRow.append(amountData);

                expenses.append(tableRow);
            }
        } else {
            console.log("No rows found.");
        }
    }).catch(error => {
        console.log("Error initializing table");
        console.log(error);
    });
}

function addTransaction() {
    fetch("/add", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ user: username, transaction: transactionName.value, date: transactionDate.value, category: transactionCategory.value, amount: transactionAmount.value }),
    }).then(response => {
        console.log("Response recieved");
        console.log(`Status: ${response.status}`);
        updateTable();
    }).catch(error => {
        console.log(error);
    });
}

