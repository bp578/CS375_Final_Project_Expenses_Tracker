function setBudget() {
    const category = document.getElementById("budget-category").value;
    const budgetAmount = parseFloat(document.getElementById("budget-amount").value);

    localStorage.setItem("budget_" + category, budgetAmount);

    window.location.href = "land.html";
}

function displayBudgets() {
    const budgetStatusElement = document.getElementById("budget-status");
    budgetStatusElement.innerHTML = ""; // Clear previous content

    for (const key in localStorage) {
        if (key.startsWith("budget_")) {
            const category = key.substring(7); // Remove "budget_" prefix
            const budgetAmount = parseFloat(localStorage.getItem(key));
            const budgetInfo = document.createElement("p");
            budgetInfo.textContent = `Category: ${category}, Budget: $${budgetAmount}`;
            budgetStatusElement.appendChild(budgetInfo);
        }
    }
}

document.getElementById("set-budget").addEventListener("click", setBudget);

document.addEventListener("DOMContentLoaded", displayBudgets);
