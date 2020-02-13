const spicedPg = require('spiced-pg');

const db = spicedPg(`postgres://postgres:postgres@localhost:5432/petition`);

exports.insert = function(first, last, signature) {
    return db.query(
        `INSERT INTO petition (first, last, signature)
        VALUES ($1, $2, $3)`,
        [first, last, signature]
    );
};

exports.select = function() {
    return db.query(
        `SELECT first || ' ' || last AS "fullname" FROM petition`
    );
};

exports.count = function() {
    return db.query(
        `SELECT COUNT(*) AS "count" FROM petition`
    );
};
