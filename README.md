# CS375_Final_Project_Expenses_Tracker

# CONTRACT

- User accounts and management
- Can import CSV of financial data, can also manually add income/expenses - might want some logic if you reimport the same CSV to not duplicate transactions or delete user-added transactions
- Users can categorize each spend by categories (of their choice, or of a predefined set of choices?)
- Summarize spend per category, compare spend from month to month
- Identify (or have user input) recurring payments, visualize somehow
- Set monthly budget, perhaps per category, view how close you are to exceeding budget

### Setup
1. In the file `env_temp.json`, change the fields `user` and `password` to your own settings
2. Run in terminal `npm install` or `npm i`
3. Run in terminal `npm run setup`
4. Run in terminal `npm run start`

### CSV File Upload
- Headers (first row) MUST be in this form: `date,transaction_name,category,amount`. Make sure there is no extra whitespace.
- date must be a valid SQL date in this format: `YYYY-MM-DD`.
- transaction_name must be a string of 50 characters or less
- category must be a string of 50 characters or less
- amount must be a float rounded to 2 decimal places
