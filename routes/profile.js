const { app, decNumSigs } = require('../index');
const { hash } = require('../utils/bc');
const {
    insertUserProfile, updateUser, updateUserPW,
    selectUserProfile, updateProfile, deleteUser
} = require('../utils/db');
const secrets = require("../secrets");

app.get("/profile", (req, res) => {
    res.render("profile", {
        layout: "main",
        login: true,
        apiKey: secrets.apiKey
    });
});

app.post("/profile", (req, res) => {
    console.log("req.body", req.body);
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
            });
    }
});

app.get("/profile/edit", (req, res) => {

    selectUserProfile(req.session.user.userID)
        .then(result => {
            console.log("coord:", result.rows[0].coord);
            const profile = result.rows[0];

            res.render("edit", {
                layout: "main",
                login: true,
                apiKey: secrets.apiKey,
                profile
            });
        })
        .catch(err => {
            console.log("error in selectUserProfile:", err);
        });
});

app.post("/profile/edit", (req, res) => {
    let { first, last, email, password, age, city, url, coord} = req.body;
    console.log("req.body edit post:", req.body);
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
                    res.redirect("/profile/edit");
                    // res.render("edit", {
                    //     template: "main",
                    //     login: true,
                    //     message: "Ups something went wrong. Please try again!"
                    // });
                });
        }).catch(err => {
            console.log("error in hashing password:", err);
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
                res.redirect("/profile/edit");
                // res.render("edit", {
                //     template: "main",
                //     login: true,
                //     message: "Ups something went wrong. Please try again!"
                // });
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
