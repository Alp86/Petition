const spicedPg = require('spiced-pg');

const db = spicedPg(
    process.env.DATABASE_URL ||
    `postgres://postgres:postgres@localhost:5432/petition`
);

exports.insertUser = function(first, last, email, password) {
    return db.query(
        `
        INSERT INTO users (first, last, email, password)
        VALUES ($1, $2, $3, $4)
        Returning id
        `,
        [first, last, email, password]
    );
};

exports.selectUser = function(email) {
    return db.query(
        `
        SELECT users.*, signatures.id AS "signatureID"
        FROM users
        LEFT JOIN signatures
        ON users.id = user_id
        WHERE email = $1
        `,
        [email]
    );
};

exports.selectSigners = function() {
    return db.query(
        `
        SELECT
            users.first, users.last,
            user_profiles.age, user_profiles.city, user_profiles.url, user_profiles.coord
        FROM users
        LEFT JOIN user_profiles
        ON users.id = user_profiles.user_id
        JOIN signatures
        ON users.id = signatures.user_id
        `
    );
};

exports.selectSignersByCity = function(city) {
    return db.query(
        `
        SELECT
            users.first, users.last,
            user_profiles.age, user_profiles.city, user_profiles.url, user_profiles.coord
        FROM users
        LEFT JOIN user_profiles
        ON users.id = user_profiles.user_id
        JOIN signatures
        ON users.id = signatures.user_id
        WHERE LOWER(user_profiles.city) = LOWER($1)
        `,
        [city]
    );
};

exports.insertSignature = function(user_id, signature) {
    return db.query(
        `
        INSERT INTO signatures (user_id, signature)
        VALUES ($1, $2)
        Returning id
        `,
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

exports.insertUserProfile = function(age, city, url, coord, user_id) {
    return db.query(
        `
        INSERT INTO user_profiles (age, city, url, coord, user_id)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [age || null, city || null, url || null, coord || null, user_id]
    );
};

exports.selectUserProfile = function(user_id) {
    return db.query(
        `
        SELECT
            users.first, users.last, users.email,
            user_profiles.age, user_profiles.city, user_profiles.url, user_profiles.coord
        FROM users
        LEFT JOIN user_profiles
        ON users.id = user_profiles.user_id
        WHERE users.id = $1
        `,
        [user_id]
    );
};

exports.updateUser = function(first, last, email, user_id) {
    return db.query(
        `
        UPDATE users
        SET first = $1, last = $2, email = $3
        WHERE id = $4
        `,
        [first, last, email, user_id]
    );
};

exports.updateUserPW = function(first, last, email, password, id) {
    return db.query(
        `
        UPDATE users
        SET first = $1, last = $2, email = $3, password = $4
        WHERE id = $5
        `,
        [first, last, email, password, id]
    );
};

exports.updateProfile = function(age, city, url, coord, user_id) {
    return db.query(
        `
        INSERT INTO user_profiles (age, city, url, coord, user_id)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id)
        DO UPDATE SET age = $1, city = $2, url = $3, coord = $4
        `,
        [age || null, city || null, url || null, coord || null, user_id]
    );
};

exports.deleteSignature = function(user_id) {
    return db.query(
        `
        DELETE FROM signatures
        WHERE user_id = $1
        `,
        [user_id]
    );
};

exports.deleteUser = function(id) {
    return db.query(
        `
        DELETE FROM users
        WHERE id = $1
        `,
        [id]
    );
};
