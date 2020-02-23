////////////////////// Imports /////////////////////
const express = require('express');
const hb = require('express-handlebars');
const cookieSession = require('cookie-session');
const csurf = require('csurf');
const { countSignatures } = require('./utils/db');


///////////////////////////////////////////////////

////////////////////// Global variables /////////////////////
let numSigs = 0;
countSignatures().then(result => {
    if (result.rows[0]) {
        numSigs = result.rows[0].numSigs;
    }
});

///////////////////////////////////////////////////

/////////////////// Set up ///////////////////
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

////////////////////// Exports /////////////////////
exports.incNumSigs = () => { numSigs++; };
exports.decNumSigs = () => { numSigs--; };
exports.getNumSigs = () => { return numSigs; };
exports.app = app;

////////////////////////////////////////////////////

///////////////////// Routes //////////////////////
app.get("/", (req, res) => {
    return res.redirect("/register");
});
require("./routes/auth");
require("./routes/petition");
require("./routes/profile");
require("./routes/thanks");

////////////////////////////////////////////////////

///////////////// Start the engine /////////////////
if (require.main === module) {
    app.listen(process.env.PORT || 8080, () => console.log(
        "petition server up and running"
    ));
}

///////////////////////////////////////////////////
