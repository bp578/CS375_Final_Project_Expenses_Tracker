DROP DATABASE IF EXISTS expensetracker;
CREATE DATABASE expensetracker;
\c expensetracker
DROP TABLE IF EXISTS accounts;
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50),
    password VARCHAR(100)
);