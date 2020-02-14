////////////////////// Set Up /////////////////////
const express = require('express');
const hb = require('express-handlebars');
// const cookieParser = require("cookie-parser");
const cookieSession = require('cookie-session');
const csurf = require('csurf');
const { insert, select, count } = require('./db');
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
////////////////////////////////////////////////////



///////////////////// Routes //////////////////////
app.get("/", (req, res) => {
    res.redirect("/petition");
});

app.get("/petition", (req, res) => {
    // if cookie redirect to thanks
    if (req.session.signatureID) {
        res.redirect("/thanks");
    } else {
        res.render("petition", {
            layout: "main"
        });
    }
});

app.post("/petition", (req, res) => {
    // redirects to /thanks if there is a cookie
    if (req.session.signatureID) {
        res.redirect("/thanks");
    } else {
        let {first, last, signature} = req.body;
        // insert submitted data into database
        insert(first, last, signature)
            // if there is no error
            .then(result => {
                // console.log("result:", result);
                let id = result.rows[0].id;
                // sets cookie to remember
                req.session.signatureID = id;
                // redirects to thank you page
                res.redirect("/thanks");
            })
            // if there is an error petition.handlebars is rendered with an error message
            .catch(err => {
                console.log("error in insert:", err);
                res.render("petition", {
                    layout: "main",
                    message: "Seems like something went wrong. Please try again!"
                });
            });
    }
});

app.get("/thanks", (req, res) => {
    if (!req.session.signatureID) {
        res.redirect("/petition");
    } else {
        select().then(result => {
            let numSigs = result.rowCount;
            let [signer] = result.rows.filter(obj => {
                return obj.id == req.session.signatureID;
            });
            res.render("thanks", {
                layout: "main",
                numSigs: numSigs,
                signature: signer.signature
            });
        });
    }
});

app.get("/signers", (req, res) => {
    if (!req.session.signatureID) {
        res.redirect("/petition");
    } else {
        select().then( result => {
            let signers = result.rows;
            res.render("signers", {
                layout: "main",
                signers
            });
        });
    }
});

app.listen(8080, () => console.log(
    "petition server up and running"
));
