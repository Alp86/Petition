////////////////////// Set Up /////////////////////
const express = require('express');
const hb = require('express-handlebars');
const cookieSession = require('cookie-session');
const csurf = require('csurf');
const { insertUser, selectUser, selectSigners, selectSignersByCity,
    insertSignature, selectSignature, countSignatures,
    insertUserProfile } = require('./utils/db');
const { hash, compare } = require('./utils/bc');

let numSigs = 0;
countSignatures().then(result => {
    if (result.rows[0]) {
        numSigs = result.rows[0].numSigs;
    }
});

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
    res.redirect("/register");
});

///////////// register /////////////
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
    const { first, last, email, password } = req.body;

    hash(password).then(hashedPw => {
        console.log("hashed PW from /register:", hashedPw);
        insertUser(first, last, email, hashedPw)
            .then(result => {
                const user_id = result.rows[0].id;
                req.session.user = {
                    userID: user_id,
                    first: first,
                    last: last,
                };
                res.redirect("/profile");
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

///////////// profile /////////////
app.get("/profile", (req, res) => {
    res.render("profile", {
        layout: "main"
    });
});

app.post("/profile", (req, res) => {
    for (var property in req.body) {
        if (req.body[property] == "") {
            req.body[property] = null;
        }
    }
    const { age, city, url } = req.body;
    console.log("req.body modified:", req.body);

    if (!age && !city && !url) {
        res.redirect("/petition");
    } else {
        if (url) {
            if (
                !url.startsWith("http://") &&
                !url.startsWith("https://") &&
                !url.startsWith("//")
            ) {
                return res.redirect("petition");
            }
        }
        // INSERT into user_profiles
        insertUserProfile(age, city, url, req.session.user.userID)
            .then( () => {
                res.redirect("petition");
            })
            .catch(err => {
                console.log("error in insertUserProfile:", err);
            });

    }

});
/////////////////////////////////

///////////// login /////////////
app.get("/login", (req, res) => {
    res.render("login", {
        layout: "main"
    });
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    selectUser(email).then(result => {
        console.log("selectUser result:", result);
        if (!result.rows[0]) {
            res.render("login", {
                layout: "main",
                message: "No account found with that email address."
            });
        } else {
            compare(result.rows[0].password, password)
                .then(pass => {
                    if (pass) {
                        req.session.user = {
                            userID: result.rows[0].id,
                            first: result.rows[0].first,
                            last: result.rows[0].last,
                            signatureID: result.rows[0].signatureID
                        };
                        if (result.rows[0].signatureID) {
                            res.redirect("/petition");
                        } else {
                            res.redirect("/thanks");
                        }
                    }
                    else {
                        res.render("login", {
                            layout: "main",
                            message: "Wrong password."
                        });
                    }
                }).catch(err => {
                    console.log("error in compare:", err);
                });
        }
    }).catch(err => {
        console.log("error in selectUser:", err);
    });
});
/////////////////////////////////


/////////// petition ///////////
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
                numSigs++;
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
/////////////////////////////////

///////////// thanks /////////////
app.get("/thanks", (req, res) => {
    if (!req.session.user.signatureID) {
        res.redirect("/petition");
    } else {

        selectSignature(req.session.user.userID)
            .then(result => {
                const signature = result.rows[0].signature;
                res.render("thanks", {
                    layout: "main",
                    numSigs: numSigs,
                    signature: signature
                });
            }).catch(err => {
                console.log("error in selectSignature:", err);
            });

        // Promise.all([
        //     selectSignature(req.session.user.userID),
        //     countSignatures()
        // ]).then(results => {
        //     const signature = results[0].rows[0].signature;
        //     const numSigs = results[1].rows[0].numSigs;
        //     res.render("thanks", {
        //         layout: "main",
        //         numSigs: numSigs,
        //         signature: signature
        //     });
        // }).catch(err => {
        //     console.log("error in Promise.all:", err);
        // });
    }
});
//////////////////////////////////

///////////// signers /////////////
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

app.get("/signers/:city", (req, res) => {
    if (!req.session.user.signatureID) {
        res.redirect("/petition");
    } else {
        selectSignersByCity(req.params.city)
            .then( result => {
                console.log("selectSignersByCity result:", result);

                let signers = result.rows;
                res.render("signers", {
                    layout: "main",
                    signers
                });
            }).catch(err => {
                console.log("error in selectSignersByCity:", err);
            });
    }
});
//////////////////////////////////////

app.listen(8080, () => console.log(
    "petition server up and running"
));
