////////////////////// Set Up /////////////////////
const express = require('express');
const hb = require('express-handlebars');
const cookieSession = require('cookie-session');
const csurf = require('csurf');
const {
    insertUser, selectUser, selectSigners, selectSignersByCity,
    insertSignature, selectSignature, countSignatures,
    insertUserProfile, selectUserProfile, updateUser, updateUserPW,
    updateProfile, deleteSignature, deleteUser
} = require('./utils/db');
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
        return res.redirect("/register");
    } else {
        next();
    }
});
////////////////////////////////////////////////////



///////////////////// Routes //////////////////////
app.get("/", (req, res) => {
    return res.redirect("/register");
});

///////////// register /////////////
app.get("/register", (req, res) => {
    if (req.session.user) {
        return res.redirect("/petition");
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
                return res.redirect("/profile");
            })
            .catch(error => {
                console.log("error in insertUser: ", error);
                res.render("register", {
                    layout: "main",
                    message: "Ups something went wrong. Please try again!"
                });
            });
    });
});

///////////// profile /////////////
app.get("/profile", (req, res) => {
    if (req.session.user.profile) {
        return res.redirect("/petition");
    }
    res.render("profile", {
        layout: "main"
    });
});

app.post("/profile", (req, res) => {
    if (req.session.user.profile) {
        return res.redirect("/petition");
    }
    const { age, city, url } = req.body;
    console.log("req.body modified:", req.body);
    req.session.user.profile = true;

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
    let { email, password } = req.body;
    selectUser(email).then(result => {
        console.log("selectUser result:", result);
        if (!result.rows[0]) {
            res.render("login", {
                layout: "main",
                message: "No account found with that email address."
            });
        } else {
            return compare(password, result.rows[0].password)
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
        let {signature} = req.body;
        // insert submitted data into database
        insertSignature(req.session.user.userID, signature)
            // if there is no error
            .then(result => {
                console.log("insertSignature result:", result);
                let signatureID = result.rows[0].id;
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
        return res.redirect("/petition");
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
    }
});
//////////////////////////////////

///////////// signers /////////////
app.get("/signers", (req, res) => {
    if (!req.session.user.signatureID) {
        return res.redirect("/petition");
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
        return res.redirect("/petition");
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

app.get("/profile/edit", (req, res) => {

    selectUserProfile(req.session.user.userID)
        .then(result => {

            const profile = result.rows[0];

            res.render("edit", {
                layout: "main",
                profile
            });
        })
        .catch(err => {
            console.log("error in selectUserProfile:", err);
        });
});

app.post("/profile/edit", (req, res) => {
    let { first, last, email, password, age, city, url} = req.body;

    if (password) {
        hash(password).then(hashedPw => {
            Promise.all([
                updateUserPW(first, last, email, hashedPw, req.session.user.userID),
                updateProfile(age, city, url, req.session.user.userID)
            ])
                .then( () => {
                    return res.redirect("/thanks");
                })
                .catch(err => {
                    console.log("error in editPW Promise.all:", err);
                    res.render("edit", {
                        template: "main",
                        message: "Ups something went wrong. Please try again!"
                    });
                });
        }).catch(err => {
            console.log("error in hashing password:", err);
        });
    } else {
        Promise.all([
            updateUser(first, last, email, req.session.user.userID),
            updateProfile(age, city, url, req.session.user.userID)
        ])
            .then( () => {
                return res.redirect("/thanks");
            })
            .catch(err => {
                console.log("error in edit Promise.all:", err);
                res.render("edit", {
                    template: "main",
                    message: "Ups something went wrong. Please try again!"
                });
            });
    }
});

app.post("/thanks/delete", (req, res) => {
    console.log("received delete request");
    deleteSignature(req.session.user.userID)
        .then(() => {
            console.log("signature has been deleted");
            delete req.session.user.signatureID;
            console.log("req.session:", req.session.user);
            numSigs--;
            return res.redirect("/petition");
        })
        .catch(err => {
            console.log("error in deleteSignature:", err);
        });
});

app.post("/deleteaccount", (req, res) => {
    deleteUser(req.session.user.userID)
        .then(() => {
            numSigs--;
            delete req.session.user;
            return res.redirect("/register");
        })
        .catch(err => {
            console.log("error in deleteUser:", err);
        });
});

app.post("/logout", (req, res) => {
    delete req.session.user;
    res.redirect("/login");
});

app.listen(process.env.PORT || 8080, () => console.log(
    "petition server up and running"
));
