CREATE DATABASE expensetracker;
\c expensetracker
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    username VARCHAR(15),
    pass VARCHAR(15)
);