let transaction = document.getElementById("transaction");
let category = document.getElementById("category");
let amount = document.getElementById("amount");
let expenses = document.getElementById("expenses");
let addButton = document.getElementById("add");

addButton.addEventListener('click', addTransaction);

function addTransaction() {
    //Add fetch function that adds the transaction to the database. Do this once database is implemented

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
}