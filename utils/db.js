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
        `SELECT users.*, signatures.id AS "signatureID"
        FROM users
        LEFT JOIN signatures
        ON users.id = user_id
        WHERE email = $1`,
        [email]
    );
};

exports.selectSigners = function() {
    return db.query(
        `SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url
        FROM users
        LEFT JOIN user_profiles
        ON users.id = user_profiles.user_id
        JOIN signatures
        ON users.id = signatures.user_id`
    );
};

exports.selectSignersByCity = function(city) {
    return db.query(
        `SELECT users.first, users.last, user_profiles.age, user_profiles.city, user_profiles.url
        FROM users
        LEFT JOIN user_profiles
        ON users.id = user_profiles.user_id
        JOIN signatures
        ON users.id = signatures.user_id
        WHERE user_profiles.city = $1`,
        [city]
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

exports.insertUserProfile = function(age, city, url, user_id) {
    return db.query(
        `INSERT INTO user_profiles (age, city, url, user_id)
        VALUES ($1, $2, $3, $4)`,
        [age, city, url, user_id]
    );
};
