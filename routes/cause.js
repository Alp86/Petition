const { app } = require('../index');

app.get("/cause", (req, res) => {

    let signed;
    let login;

    if (req.session.user) {
        login = true;
        if (req.session.user.signatureID) {
            signed = true;
        } else {
            signed = false;
        }
    } else {
        login = false;
    }
    
    res.render("cause", {
        layout: "main",
        login: login,
        signed: signed
    });
});
