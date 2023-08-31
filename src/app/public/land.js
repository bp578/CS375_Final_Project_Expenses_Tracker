let transactionName = document.getElementById("transaction");
let transactionDate = document.getElementById("date");
let transactionCategory = document.getElementById("category");
let transactionAmount = document.getElementById("amount");
let expenses = document.getElementById("expenses");
let addButton = document.getElementById("add");
let welcome = document.getElementById("welcome");
let csvFile = document.getElementById("csvFileInput");
let uploadCsvButton = document.getElementById("uploadCsvButton");


addButton.addEventListener('click', addTransaction);
uploadCsvButton.addEventListener('click', addTransactionsFromCsv);
welcome.textContent = `Your expenses`;


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
        body: JSON.stringify({ transaction: transactionName.value, date: transactionDate.value, category: transactionCategory.value, amount: transactionAmount.value }),
    }).then(response => {
        console.log("Response recieved");
        console.log(`Status: ${response.status}`);
        updateTable();
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
        }).catch(error => {
            console.error('Error: ', error);
        });
    }
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
