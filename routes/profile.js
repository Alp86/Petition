const { app, decNumSigs } = require('../index');
const { hash } = require('../utils/bc');
const {
    insertUserProfile, updateUser, updateUserPW,
    selectUserProfile, updateProfile, deleteUser
} = require('../utils/db');
const apiKey = process.env.apiKey || require("../secrets").apiKey;

app.get("/profile", (req, res) => {
    let signed;
    req.session.user.signatureID ? signed = true : signed = false;

    let error;
    req.session.user.error ? error = true : error = false;
    delete req.session.user.error;

    res.render("profile", {
        layout: "main",
        login: true,
        signed: signed,
        error: error,
        apiKey: apiKey
    });
});

app.post("/profile", (req, res) => {
    const { age, city, url, coord } = req.body;

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
        insertUserProfile(age, city, url, coord, req.session.user.userID)
            .then( () => {
                res.redirect("petition");
            })
            .catch(err => {
                console.log("error in insertUserProfile:", err);
                req.session.user.error = true;
                res.redirect("/profile");
            });
    }
});

app.get("/profile/edit", (req, res) => {

    selectUserProfile(req.session.user.userID)
        .then(result => {
            let signed;
            req.session.user.signatureID ? signed = true : signed = false;

            let error;
            req.session.user.error ? error = true : error = false;
            delete req.session.user.error;

            const profile = result.rows[0];

            res.render("edit", {
                layout: "main",
                login: true,
                signed: signed,
                error: error,
                apiKey: apiKey,
                profile
            });
        })
        .catch(err => {
            console.log("error in selectUserProfile:", err);
        });
});

app.post("/profile/edit", (req, res) => {
    let { first, last, email, password, age, city, url, coord} = req.body;
    if (url) {
        if (
            !url.startsWith("http://") &&
            !url.startsWith("https://") &&
            !url.startsWith("//")
        ) {
            url = "";
        }
    }
    if (password) {
        hash(password).then(hashedPw => {
            Promise.all([
                updateUserPW(first, last, email, hashedPw, req.session.user.userID),
                updateProfile(age, city, url, coord, req.session.user.userID)
            ])
                .then( () => {
                    return res.redirect("/thanks");
                })
                .catch(err => {
                    console.log("error in editPW Promise.all:", err);
                    req.session.user.error = true;
                    res.redirect("/profile/edit");
                });
        }).catch(err => {
            console.log("error in hashing password:", err);
            res.redirect("/profile/edit");
        });
    } else {
        Promise.all([
            updateUser(first, last, email, req.session.user.userID),
            updateProfile(age, city, url, coord, req.session.user.userID)
        ])
            .then( () => {
                return res.redirect("/thanks");
            })
            .catch(err => {
                console.log("error in edit Promise.all:", err);
                req.session.user.error = true;
                res.redirect("/profile/edit");
            });
    }
});

app.get("/deleteaccount", (req, res) => {
    deleteUser(req.session.user.userID)
        .then(() => {
            decNumSigs();
            delete req.session.user;
            return res.redirect("/register");
        })
        .catch(err => {
            console.log("error in deleteUser:", err);
        });
});
