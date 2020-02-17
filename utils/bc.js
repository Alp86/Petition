const bcrypt = require('bcryptjs');
let {genSalt, hash, compare} = bcrypt;
const {promisify} = require('util');

genSalt = promisify(genSalt);
hash = promisify(hash);
compare = promisify(compare);

module.exports.compare = compare;
module.exports.hash = plainText => genSalt().then(salt => (hash(plainText, salt)));


// genSalt().then( salt => {
//     // console.log("salt created by bcrypt:", salt);
//     return hash('safePassword', salt);
// }).then(hashedPw => {
//     // console.log("hashedPw plus salt output:", hashedPw);
//     return compare('safePassword', hashedPw);
// }).then(matchValueCompare => {
//     console.log("password provided is:", matchValueCompare);
// });
