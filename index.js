////////////////////// Set Up /////////////////////
const express = require('express');
const hb = require('express-handlebars');
const cookieSession = require('cookie-session');
const csurf = require('csurf');
const { insertUser, selectUser, selectSigners, insertSignature, selectSignature, countSignatures } = require('./utils/db');
const { hash, compare } = require('./utils/bc');

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

    if (!req.session.user && !(req.url.startsWith("/register") || req.url.startsWith("/login"))) {
        res.redirect("/register");
    } else {
        next();
    }
});
////////////////////////////////////////////////////



///////////////////// Routes //////////////////////
app.get("/", (req, res) => {
    // res.redirect("/petition");
    res.redirect("/register");
});

app.get("/register", (req, res) => {
    if (req.session.user) {
        res.redirect("/petition");
    } else {
        res.render("register", {
            layout: "main"
        });
    }
});

app.post("/register", (req, res) => {
    // You will want to grab the user password provied, i.e. sth like req.body.password
    // use hash to take user input created the hashed version of PW to store in DB
    const { first, last, email, password } = req.body;

    hash(password).then(hashedPw => {
        console.log("hashed PW from /register:", hashedPw);
        insertUser(first, last, email, hashedPw)
            .then(result => {
                const user_id = result.rows[0].id;
                // sets cookie to remember
                req.session.user = {
                    userID: user_id,
                    first: first,
                    last: last,
                };
                res.redirect("/petition");
            })
            .catch(error => {
                console.log("error in insertUser: ", error);
                res.render("/register", {
                    layout: "main",
                    message: "Ups something went wrong. Please try again!"
                });
            });
    });
});

app.get("/login", (req, res) => {
    res.render("login", {
        layout: "main"
    });
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    selectUser(email).then(result => {
        if(compare(result.rows[0].password, password)) {
            // req.session.userID = result.rows[0].id;
            req.session.user = {
                userID: result.rows[0].id,
                first: result.rows[0].first,
                last: result.rows[0].last
            };
            selectSignature(req.session.user.userID).then(result => {
                if (result.rows.length == 0) {
                    res.redirect("/petition");
                } else {
                    req.session.user.signatureID = result.rows[0].id;
                    res.redirect("/thanks");
                }
            }).catch(err => {
                console.log("error in selectSignature:", err);
            });
        }
    }).catch(err => {
        console.log("error in selectUser:", err);
    });
});

app.get("/petition", (req, res) => {
    // if cookie redirect to thanks
    if (req.session.user.signatureID) {
        res.redirect("/thanks");
    } else {
        res.render("petition", {
            layout: "main"
        });
    }
});

app.post("/petition", (req, res) => {
    // redirects to /thanks if there is a cookie
    if (req.session.user.signatureID) {
        res.redirect("/thanks");
    } else {
        const {signature} = req.body;
        // insert submitted data into database
        insertSignature(req.session.user.userID, signature)
            // if there is no error
            .then(result => {
                console.log("insertSignature result:", result);
                const signatureID = result.rows[0].id;
                // sets cookie to remember
                req.session.user.signatureID = signatureID;
                // redirects to thank you page
                res.redirect("/thanks");
            })
            // if there is an error petition.handlebars is rendered with an error message
            .catch(err => {
                console.log("error in insertSignature:", err);
                res.render("petition", {
                    layout: "main",
                    message: "Ups something went wrong. Please try again!"
                });
            });
    }
});

app.get("/thanks", (req, res) => {
    if (!req.session.user.signatureID) {
        res.redirect("/petition");
    } else {

        Promise.all([
            selectSignature(req.session.user.userID),
            countSignatures()
        ]).then(results => {
            const signature = results[0].rows[0].signature;
            const numSigs = results[1].rows[0].numSigs;
            res.render("thanks", {
                layout: "main",
                numSigs: numSigs,
                signature: signature
            });
        }).catch(err => {
            console.log("error in Promise.all:", err);
        });
    }
});

app.get("/signers", (req, res) => {
    if (!req.session.user.signatureID) {
        res.redirect("/petition");
    } else {
        selectSigners().then( result => {
            console.log("selectSigners result:", result);
            let signers = result.rows;
            res.render("signers", {
                layout: "main",
                signers
            });
        }).catch(err => {
            console.log("error in selectSigners:", err);
        });
    }
});

app.listen(8080, () => console.log(
    "petition server up and running"
));
