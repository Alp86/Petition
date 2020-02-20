const { app } = require('../index');
const { hash } = require('../utils/bc');
const {
    insertUserProfile, updateUser, updateUserPW,
    selectUserProfile, updateProfile, deleteUser
} = require('../utils/db');


app.get("/profile", (req, res) => {
    res.render("profile", {
        layout: "main",
        login: true
    });
});

app.post("/profile", (req, res) => {
    const { age, city, url } = req.body;

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
        insertUserProfile(age, city, url, req.session.user.userID)
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

            const profile = result.rows[0];

            res.render("edit", {
                layout: "main",
                login: true,
                profile
            });
        })
        .catch(err => {
            console.log("error in selectUserProfile:", err);
        });
});

app.post("/profile/edit", (req, res) => {
    let { first, last, email, password, age, city, url} = req.body;

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
                updateProfile(age, city, url, req.session.user.userID)
            ])
                .then( () => {
                    return res.redirect("/thanks");
                })
                .catch(err => {
                    console.log("error in editPW Promise.all:", err);
                    res.render("edit", {
                        template: "main",
                        login: true,
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
                    login: true,
                    message: "Ups something went wrong. Please try again!"
                });
            });
    }
});

app.get("/deleteaccount", (req, res) => {
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
