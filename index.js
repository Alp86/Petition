////////////////////// Set Up /////////////////////
const express = require('express');
const hb = require('express-handlebars');
const cookieSession = require('cookie-session');
const csurf = require('csurf');
const { countSignatures } = require('./utils/db');
// const { hash, compare } = require('./utils/bc');
// const { requireLoggedOutUser, requireSignature, requireNoSignature} = require("./utils/middleware");

let numSigs = 0;

countSignatures().then(result => {
    if (result.rows[0]) {
        numSigs = result.rows[0].numSigs;
    }
});

exports.incNumSigs = () => { numSigs++; };
exports.decNumSigs = () => { numSigs--; };
exports.getNumSigs = () => { return numSigs; };

const app = express();

app.engine('handlebars', hb());
app.set('view engine', 'handlebars');
///////////////////////////////////////////////////

/////////////////// Middle Ware ///////////////////
app.use(express.static("./public"));

app.use(
    express.urlencoded({
        extended: false
    })
);

app.use(cookieSession({
    secret: `I'm always angry.`,
    maxAge: 1000 * 60 * 60 * 24 * 14
}));

app.use(csurf());

app.use((req, res, next) => {
    res.set('x-frame-options', 'DENY');
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use((req, res, next) => {
    if (!req.session.user && req.url != '/register' && req.url != '/login') {
        res.redirect('/register');
    } else {
        next();
    }
});
////////////////////////////////////////////////////

module.exports.app = app;
///////////////////// Routes //////////////////////
app.get("/", (req, res) => {
    return res.redirect("/register");
});

///////////// register /////////////
// app.get("/register", requireLoggedOutUser, (req, res) => {
//     res.render("register", {
//         layout: "main",
//         login: false
//     });
// });
//
// app.post("/register", requireLoggedOutUser, (req, res) => {
//     const { first, last, email, password } = req.body;
//
//     hash(password).then(hashedPw => {
//         insertUser(first, last, email, hashedPw)
//             .then(result => {
//                 const user_id = result.rows[0].id;
//                 req.session.user = {
//                     userID: user_id,
//                     first: first,
//                     last: last,
//                 };
//                 return res.redirect("/profile");
//             })
//             .catch(error => {
//                 console.log("error in insertUser: ", error);
//                 res.render("register", {
//                     layout: "main",
//                     login: false,
//                     message: "Ups something went wrong. Please try again!"
//                 });
//             });
//     });
// });


/////////////////////////////////

///////////// login /////////////
// app.get("/login", requireLoggedOutUser, (req, res) => {
//     res.render("login", {
//         layout: "main",
//         login: false
//     });
// });
//
// app.post("/login", requireLoggedOutUser, (req, res) => {
//     let { email, password } = req.body;
//     selectUser(email).then(result => {
//         if (!result.rows[0]) {
//             res.render("login", {
//                 layout: "main",
//                 login: false,
//                 message: "No account found with that email address."
//             });
//         } else {
//             return compare(password, result.rows[0].password)
//                 .then(pass => {
//                     if (pass) {
//                         req.session.user = {
//                             userID: result.rows[0].id,
//                             first: result.rows[0].first,
//                             last: result.rows[0].last,
//                             signatureID: result.rows[0].signatureID
//                         };
//                         if (result.rows[0].signatureID) {
//                             res.redirect("/petition");
//                         } else {
//                             res.redirect("/thanks");
//                         }
//                     }
//                     else {
//                         res.render("login", {
//                             layout: "main",
//                             message: "Wrong password."
//                         });
//                     }
//                 }).catch(err => {
//                     console.log("error in compare:", err);
//                 });
//         }
//     }).catch(err => {
//         console.log("error in selectUser:", err);
//     });
// });
require("./routes/auth");
/////////////////////////////////

///////////// profile /////////////
// app.get("/profile", (req, res) => {
//     res.render("profile", {
//         layout: "main",
//         login: true
//     });
// });
//
// app.post("/profile", (req, res) => {
//     const { age, city, url } = req.body;
//
//     if (!age && !city && !url) {
//         res.redirect("/petition");
//     } else {
//         if (url) {
//             if (
//                 !url.startsWith("http://") &&
//                 !url.startsWith("https://") &&
//                 !url.startsWith("//")
//             ) {
//                 return res.redirect("petition");
//             }
//         }
//         insertUserProfile(age, city, url, req.session.user.userID)
//             .then( () => {
//                 res.redirect("petition");
//             })
//             .catch(err => {
//                 console.log("error in insertUserProfile:", err);
//             });
//
//     }
//
// });
/////////////////////////////////

/////////// petition ///////////
// app.get("/petition", requireNoSignature, (req, res) => {
//     res.render("petition", {
//         layout: "main",
//         login: true
//     });
// });
//
// app.post("/petition", requireNoSignature, (req, res) => {
//     let {signature} = req.body;
//     // insert submitted data into database
//     insertSignature(req.session.user.userID, signature)
//         // if there is no error
//         .then(result => {
//             console.log("insertSignature result:", result);
//             let signatureID = result.rows[0].id;
//             // sets cookie to remember
//             req.session.user.signatureID = signatureID;
//             numSigs++;
//             // redirects to thank you page
//             res.redirect("/thanks");
//         })
//         // if there is an error petition.handlebars is rendered with an error message
//         .catch(err => {
//             console.log("error in insertSignature:", err);
//             res.render("petition", {
//                 layout: "main",
//                 login: true,
//                 message: "Ups something went wrong. Please try again!"
//             });
//         });
// });
/////////////////////////////////

///////////// thanks /////////////
// app.get("/thanks", requireSignature, (req, res) => {
//     selectSignature(req.session.user.userID)
//         .then(result => {
//             const signature = result.rows[0].signature;
//             res.render("thanks", {
//                 layout: "main",
//                 login: true,
//                 numSigs: numSigs,
//                 signature: signature
//             });
//         }).catch(err => {
//             console.log("error in selectSignature:", err);
//         });
// });
//////////////////////////////////
require("./routes/petition");
///////////// signers /////////////
// app.get("/signers", requireSignature, (req, res) => {
//     selectSigners().then( result => {
//         console.log("selectSigners result:", result);
//         let signers = result.rows;
//         res.render("signers", {
//             layout: "main",
//             login: true,
//             signers
//         });
//     }).catch(err => {
//         console.log("error in selectSigners:", err);
//     });
// });
//
// app.get("/signers/:city", requireSignature, (req, res) => {
//     selectSignersByCity(req.params.city)
//         .then( result => {
//             console.log("selectSignersByCity result:", result);
//
//             let signers = result.rows;
//             res.render("signers", {
//                 layout: "main",
//                 login: true,
//                 signers
//             });
//         }).catch(err => {
//             console.log("error in selectSignersByCity:", err);
//         });
// });
//////////////////////////////////////

// app.get("/profile/edit", (req, res) => {
//
//     selectUserProfile(req.session.user.userID)
//         .then(result => {
//
//             const profile = result.rows[0];
//
//             res.render("edit", {
//                 layout: "main",
//                 login: true,
//                 profile
//             });
//         })
//         .catch(err => {
//             console.log("error in selectUserProfile:", err);
//         });
// });
//
// app.post("/profile/edit", (req, res) => {
//     let { first, last, email, password, age, city, url} = req.body;
//
//     if (url) {
//         if (
//             !url.startsWith("http://") &&
//             !url.startsWith("https://") &&
//             !url.startsWith("//")
//         ) {
//             url = "";
//         }
//     }
//     if (password) {
//         hash(password).then(hashedPw => {
//             Promise.all([
//                 updateUserPW(first, last, email, hashedPw, req.session.user.userID),
//                 updateProfile(age, city, url, req.session.user.userID)
//             ])
//                 .then( () => {
//                     return res.redirect("/thanks");
//                 })
//                 .catch(err => {
//                     console.log("error in editPW Promise.all:", err);
//                     res.render("edit", {
//                         template: "main",
//                         login: true,
//                         message: "Ups something went wrong. Please try again!"
//                     });
//                 });
//         }).catch(err => {
//             console.log("error in hashing password:", err);
//         });
//     } else {
//         Promise.all([
//             updateUser(first, last, email, req.session.user.userID),
//             updateProfile(age, city, url, req.session.user.userID)
//         ])
//             .then( () => {
//                 return res.redirect("/thanks");
//             })
//             .catch(err => {
//                 console.log("error in edit Promise.all:", err);
//                 res.render("edit", {
//                     template: "main",
//                     login: true,
//                     message: "Ups something went wrong. Please try again!"
//                 });
//             });
//     }
// });

require("./routes/profile");

// app.post("/thanks/delete", (req, res) => {
//     console.log("received delete request");
//     deleteSignature(req.session.user.userID)
//         .then(() => {
//             console.log("signature has been deleted");
//             delete req.session.user.signatureID;
//             console.log("req.session:", req.session.user);
//             numSigs--;
//             return res.redirect("/petition");
//         })
//         .catch(err => {
//             console.log("error in deleteSignature:", err);
//         });
// });
require("./routes/thanks");


// app.get("/logout", (req, res) => {
//     delete req.session.user;
//     res.redirect("/login");
// });

if (require.main === module) {
    app.listen(process.env.PORT || 8080, () => console.log(
        "petition server up and running"
    ));
}
