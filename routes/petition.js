const { app, incNumSigs } = require('../index');
const { requireNoSignature } = require('../utils/middleware');
const { insertSignature } = require('../utils/db');

app.get("/petition", requireNoSignature, (req, res) => {
    res.render("petition", {
        layout: "main",
        login: true
    });
});


app.post("/petition", requireNoSignature, (req, res) => {
    let { signature } = req.body;
    // insert submitted data into database
    insertSignature(req.session.user.userID, signature)
        // if there is no error
        .then(result => {
            console.log("insertSignature result:", result);
            let signatureID = result.rows[0].id;
            // sets cookie to remember
            req.session.user.signatureID = signatureID;
            incNumSigs();
            // redirects to thank you page
            res.redirect("/thanks");
        })
        // if there is an error petition.handlebars is rendered with an error message
        .catch(err => {
            console.log("error in insertSignature:", err);
            res.render("petition", {
                layout: "main",
                login: true,
                message: "Ups something went wrong. Please try again!"
            });
        });
});
