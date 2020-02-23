const {app} = require('../index');
const { requireLoggedOutUser } = require('../utils/middleware');
const { hash, compare } = require('../utils/bc');
const { insertUser, selectUser } = require('../utils/db');


app.get("/register", requireLoggedOutUser, (req, res) => {
    res.render("register", {
        layout: "main",
        login: false
    });
});

app.post("/register", requireLoggedOutUser, (req, res) => {
    const { first, last, email, password } = req.body;

    hash(password).then(hashedPw => {
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
                    login: false,
                    error: true
                });
            });
    });
});

app.get("/login", requireLoggedOutUser, (req, res) => {
    console.log("login request received");
    res.render("login", {
        layout: "main",
        login: false
    });
});

app.post("/login", requireLoggedOutUser, (req, res) => {
    let { email, password } = req.body;
    selectUser(email).then(result => {
        if (!result.rows[0]) {
            res.render("login", {
                layout: "main",
                login: false,
                error: true,
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
                            error: true,
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

app.get("/logout", (req, res) => {
    delete req.session.user;
    res.redirect("/cause");
});
