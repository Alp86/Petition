module.exports = {
    requireLoggedOutUser(req, res, next) {
        if (req.session.user) {
            res.redirect('/petition');
        } else {
            next();
        }
    },
    requireNoSignature(req, res, next) {
        if (req.session.user.signatureID) {
            res.redirect('/thanks');
        } else {
            next();
        }
    },
    requireSignature(req, res, next) {
        if (!req.session.user.signatureID) {
            res.redirect('/petition');
        } else {
            next();
        }
    }
};
