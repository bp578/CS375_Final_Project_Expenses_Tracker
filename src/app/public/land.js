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

function addTransaction() {
    //Add fetch function that adds the transaction to the database. Do this once database is implemented
    fetch("/add", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ user: username, transaction: transactionName.value, date: transactionDate.value, category: transactionCategory.value, amount: transactionAmount.value }),
    }).then(response => {
        console.log("Response recieved");
        console.log(`Status: ${response.status}`);
    }).catch(error => {
        console.log(error);
    });

    /*
    //For now, add to the table using user input
    let tableRow = document.createElement("tr");
    let transactionData = document.createElement("td");
    let categoryData = document.createElement("td");
    let amountData = document.createElement("td");

    //Initialize data
    transactionData.textContent = transaction.value;
    categoryData.textContent = category.value;
    amountData.textContent = amount.value;

    //Add data to row
    tableRow.append(transactionData);
    tableRow.append(categoryData);
    tableRow.append(amountData);

    console.log("Expense added");
    expenses.append(tableRow);
    */
}