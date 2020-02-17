const spicedPg = require('spiced-pg');

const db = spicedPg(`postgres://postgres:postgres@localhost:5432/petition`);

exports.insertUser = function(first, last, email, password) {
    return db.query(
        `INSERT INTO users (first, last, email, password)
        VALUES ($1, $2, $3, $4)
        Returning id`,
        [first, last, email, password]
    );
};

exports.selectUser = function(email) {
    return db.query(
        `SELECT first, last, id, password FROM users WHERE email = $1`,
        [email]
    );
};

exports.selectSigners = function() {
    return db.query(
        `SELECT first, last FROM users
        JOIN signatures ON users.id = signatures.user_id
        `,
    );
};

exports.insertSignature = function(user_id, signature) {
    return db.query(
        `INSERT INTO signatures (user_id, signature)
        VALUES ($1, $2)
        Returning id`,
        [user_id, signature]
    );
};

exports.selectSignature = function(user_id) {
    return db.query(
        `SELECT signature, id FROM signatures WHERE user_id = $1`,
        [user_id]
    );
};

exports.countSignatures = function() {
    return db.query(
        `SELECT count(*) AS "numSigs" FROM signatures`
    );
};
