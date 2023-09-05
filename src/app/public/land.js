let transactionName = document.getElementById("transaction");
let transactionDate = document.getElementById("date");
let transactionCategory = document.getElementById("category");
let transactionAmount = document.getElementById("amount");
let expenses = document.getElementById("expenses");
let addButton = document.getElementById("add");
let welcome = document.getElementById("welcome");
let csvFile = document.getElementById("csvFileInput");
let uploadCsvButton = document.getElementById("uploadCsvButton");
let monthlyexpenses = document.getElementById("monthlyexpenses");
let months = document.getElementById("months");


addButton.addEventListener('click', addTransaction);
uploadCsvButton.addEventListener('click', addTransactionsFromCsv);
months.addEventListener('change', getMonthlySpending);
welcome.textContent = `Your expenses`;

getMonthlySpending();
updateTable();

//Add expenses from database to table when user logs in
function updateTable() {
    fetch(`/expenses`).then(response => {
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
                let deleteButton = createDeleteButton(row["transaction_id"]);

                //Initialize data
                idData.textContent = row["transaction_id"];
                nameData.textContent = row["transaction_name"];
                dateData = row["date"].slice(0, 10);
                categoryData.textContent = row["category"];
                amountData.textContent = `$${row["amount"]}`;
                nameData.append(deleteButton);

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
        body: JSON.stringify({ transaction: transactionName.value, date: transactionDate.value, category: transactionCategory.value, amount: transactionAmount.value }),
    }).then(response => {
        console.log("Response recieved");
        console.log(`Status: ${response.status}`);
        updateTable();
        getMonthlySpending();
    }).catch(error => {
        console.log(error);
    });
}

function addTransactionsFromCsv() {
    const file = csvFile.files[0];

    if (file) {
        const formData = new FormData();
        formData.append('csvFile', file);

        fetch(`/upload`, {
            method: 'POST',
            body: formData
        }).then(response => response.text()
        ).then(data => {
            console.log(data);
            updateTable();
            getMonthlySpending();
        }).catch(error => {
            console.error('Error: ', error);
        });
    }
}

function createDeleteButton(id) {
    let button = document.createElement("button");
    button.className = "delete";
    button.textContent = "x";

    button.addEventListener('click', deleteRow => {
        fetch(`/delete?id=${id}`).then(response => {
            console.log("Deleting row...");
            console.log(response.status);
            return response;
        }).then(response => {
            updateTable();
            getMonthlySpending();
            console.log(`Row of id ${id} deleted`);
        }).catch(error => {
            console.log("Error deleting row");
            console.log(error);
        });
    })

    return button;
}

function getMonthlySpending() {
    fetch(`/monthly?month=${months.value}`).then(response => {
        console.log("Updating monthly spending table...")
        console.log(response.status);
        return response.json();
    }).then(data => {
        let rows = data.rows;
        console.log(data.rows);
        if (rows) {
            monthlyexpenses.textContent = '';
            for (let row of rows) {
                let tableRow = document.createElement("tr");
                let categoryData = document.createElement("td");
                let sumData = document.createElement("td");

                //Initialize data
                categoryData.textContent = row["category"];
                sumData.textContent = `$${row["sum"]}`;

                //Add data to row
                tableRow.append(categoryData);
                tableRow.append(sumData);

                monthlyexpenses.append(tableRow);
            }
        } else {
            console.log("No rows found.");
        }
    }).catch(error => {
        console.log("Error initializing table");
        console.log(error);
    });
}

document.getElementById("logout").addEventListener("click", async () => {
    fetch("/logout").then(res => {
        console.log(res.status);
        if (res.status >= 400) {
            return res.json().then(body => {
                console.log(body["error"]);
            });
        } else {
            return res.json().then(body => {
                window.location.href = body["url"];
            })
        }
    })
})


document.getElementById("refresh").addEventListener("click", async () => {
    try {
        let res = await fetch("/refresh");
        console.log(res.status);
        if (res.status >= 400){
            let body = await res.json()
        } else {
            let body = await res.json(); 
            
        }
    } catch (error) {
        console.log(error);
    }
});

document.getElementById("add_recurring").addEventListener("click", async () => {

    let res = await fetch("/add_recurring", {method: "POST", headers: {"Content-Type": "application/json"}, body:{}});
});

// Event listener for the "Set Monthly Budget" button
document.getElementById("go-to-set-budget").addEventListener("click", function() {
    window.location.href = "set-budget.html";
});

// Event listener for displaying budgets on the "land" page
document.addEventListener("DOMContentLoaded", displayBudgets);


function displayBudgets() {
    const budgetStatusElement = document.getElementById("budget-status");
    budgetStatusElement.innerHTML = ""; // Clear previous content

    // Retrieve and display budget information from local storage
    for (const key in localStorage) {
        if (key.startsWith("budget_")) {
            const category = key.substring(7); // Remove "budget_" prefix
            const budgetAmount = parseFloat(localStorage.getItem(key));
            const budgetInfo = document.createElement("p");
            budgetInfo.textContent = `Category: ${category}, Budget: $${budgetAmount}`;
            budgetStatusElement.appendChild(budgetInfo);
        }}}
