# CS375_Final_Project_Expenses_Tracker

# CONTRACT

- User accounts and management
- Can import CSV of financial data, can also manually add income/expenses - might want some logic if you reimport the same CSV to not duplicate transactions or delete user-added transactions
- Users can categorize each spend by categories (of their choice, or of a predefined set of choices?)
- Summarize spend per category, compare spend from month to month
- Identify (or have user input) recurring payments, visualize somehow
- Set monthly budget, perhaps per category, view how close you are to exceeding budget

### Setup
1. Create a setup.sql file<br />
Insert this into `setup.sql` file:
```sql
CREATE DATABASE expensetracker;
\c expensetracker
CREATE TABLE accounts (
id SERIAL PRIMARY KEY,
username VARCHAR(50),
pass VARCHAR(100)
);
```
2. Run in terminal `npm install` or `npm i`
3. Run in terminal `npm run setup`
4. Run in terminal `npm run start`
