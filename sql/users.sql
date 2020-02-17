DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first VARCHAR NOT NULL CHECK (first != ''),
    last VARCHAR NOT NULL CHECK (last != ''),
    email VARCHAR NOT NULL UNIQUE CHECK (last != ''),
    password VARCHAR NOT NULL CHECK (last != ''),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
