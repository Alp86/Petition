const { app, getNumSigs, decNumSigs } = require('../index');
const { requireSignature } = require('../utils/middleware');
const {
    selectSigners, selectSignersByCity,
    selectSignature, deleteSignature
} = require('../utils/db');

app.get("/thanks", requireSignature, (req, res) => {
    selectSignature(req.session.user.userID)
        .then(result => {
            const signature = result.rows[0].signature;
            res.render("thanks", {
                layout: "main",
                login: true,
                numSigs: getNumSigs(),
                signature: signature
            });
        }).catch(err => {
            console.log("error in selectSignature:", err);
        });
});

app.post("/thanks/delete", (req, res) => {
    console.log("received delete request");
    deleteSignature(req.session.user.userID)
        .then(() => {
            console.log("signature has been deleted");
            delete req.session.user.signatureID;
            console.log("req.session:", req.session.user);
            decNumSigs();
            return res.redirect("/petition");
        })
        .catch(err => {
            console.log("error in deleteSignature:", err);
        });
});

app.get("/signers", requireSignature, (req, res) => {
    selectSigners().then( result => {
        console.log("selectSigners result:", result);
        let signers = result.rows;
        res.render("signers", {
            layout: "main",
            login: true,
            signers
        });
    }).catch(err => {
        console.log("error in selectSigners:", err);
    });
});

app.get("/signers/:city", requireSignature, (req, res) => {
    selectSignersByCity(req.params.city)
        .then( result => {
            console.log("selectSignersByCity result:", result);

            let signers = result.rows;
            res.render("signers", {
                layout: "main",
                login: true,
                signers
            });
        }).catch(err => {
            console.log("error in selectSignersByCity:", err);
        });
});
