const { app, getNumSigs, decNumSigs } = require('../index');
const { requireSignature } = require('../utils/middleware');
const {
    selectSigners, selectSignersByCity,
    selectSignature, deleteSignature
} = require('../utils/db');
const secrets = require("../secrets");

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
            decNumSigs();
            return res.redirect("/petition");
        })
        .catch(err => {
            console.log("error in deleteSignature:", err);
        });
});

app.get("/signers", requireSignature, (req, res) => {
    selectSigners().then( result => {
        let signers = result.rows;
        let coords = [];
        for (var i = 0; i < signers.length; i++) {
            coords.push({
                name: `${signers[i].first} ${signers[i].last}`,
                coord: JSON.parse(signers[i].coord)
            });
        }
        coords = JSON.stringify(coords);
        console.log("coords:", coords);
        res.render("signers", {
            layout: "main",
            login: true,
            apiKey: secrets.apiKey,
            coords: coords,
            signers
        });
    }).catch(err => {
        console.log("error in selectSigners:", err);
    });
});

app.get("/signers/:city", requireSignature, (req, res) => {
    selectSignersByCity(req.params.city)
        .then( result => {
            let signers = result.rows;
            let coords = [];
            for (var i = 0; i < signers.length; i++) {
                coords.push(signers[i].coord);
            }
            res.render("signers", {
                layout: "main",
                login: true,
                apiKey: secrets.apiKey,
                coords: coords,
                signers
            });
        }).catch(err => {
            console.log("error in selectSignersByCity:", err);
        });
});
