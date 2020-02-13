const express = require("express");
const hb = require('express-handlebars');
const cookieParser = require("cookie-parser");
const { insert, select, count } = require("./db");
const app = express();

app.engine('handlebars', hb());
app.set('view engine', 'handlebars');
app.use(express.static("./public"));

app.use(
    express.urlencoded({
        extended: false
    })
);

app.use(cookieParser());

app.get("/petition", (req, res) => {
    if (req.cookies.signed) {
        res.redirect("/thanks");
    } else {
        res.render("petition", {
            layout: "main"
        });
    }
});

app.post("/petition", (req, res) => {
    // redirects to /thanks if there is a cookie
    if (req.cookies.signed) {
        res.redirect("/thanks");
    } else {
        let {first, last, signature} = req.body;
        if (first == "" || last == "" || signature == "") {
            res.render("petition", {
                layout: "main",
                message: "Seems like something went wrong. Please try again!"
            });
        } else {
            // do insert of submitted data into database
            insert(first, last, signature)
            // if there is no error
                .then(success => {
                    console.log("success:", success);
                    // sets cookie to remember
                    // res.cookie("signed", true);
                    // redirects to thank you page
                    res.redirect("/thanks");
                })
                .catch(err => {
                    // if there is an error petition.handlebars is rendered with an error message
                    console.log("error in insert:", err);
                    res.render("petition", {
                        layout: "main",
                        message: "Seems like something went wrong. Please try again!"
                    });
                });
        }
    }
});

app.get("/thanks", (req, res) => {
    if (!req.cookies.signed) {
        res.redirect("/petition");
    } else {
        count().then(result => {
            console.log(result.rows[0].count);
            res.render("thanks", {
                layout: "main",
                signatures: result.rows[0].count
            });

        });

    }
});

app.get("/signers", (req, res) => {
    if (!req.cookies.signed) {
        res.redirect("/petition");
    } else {
        select().then(names => {
            let signerNames = names.rows[0];
            console.log(names.rows);
            res.render("signers", {
                layout: "main",
                signerNames
            });
        });

    }
});

app.listen(8080, () => console.log(
    "petition server up and running"
));
