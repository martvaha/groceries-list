"use strict";
exports.__esModule = true;
var functions = require("firebase-functions");
var nodemailer = require("nodemailer");
var admin = require("firebase-admin");
// Sends an email when a list is being shared
exports.sendEmail = functions.firestore.document('/invites/{uid}').onCreate(function (event) {
    var shareObject = event.data();
    console.log(shareObject);
    if (!(shareObject && shareObject.to))
        return Promise.resolve(true);
    var mailOptions = {
        subject: 'Listi jagamine',
        text: 'Test email',
        from: '"Groceries List" <info@groceries-list.com>',
        to: shareObject.to
    };
    var emailConfig = functions.config().email;
    var mailTransportConfig = {};
    if (emailConfig.service === 'test') {
        mailTransportConfig = {
            host: 'smtp.ethereal.email',
            port: 587,
            auth: { user: 'eestybztixlicwd2@ethereal.email', pass: 'bBWTx1VDagfCMceQhv' }
        };
    }
    else {
        mailTransportConfig = {
            service: emailConfig.service,
            auth: { user: emailConfig.user, pass: emailConfig.pass }
        };
    }
    var mailTransport = nodemailer.createTransport(mailTransportConfig);
    return mailTransport
        .sendMail(mailOptions)
        .then(function (info) {
        console.log('Email sent');
        if (emailConfig.service === 'test') {
            console.log('Preview: ' + nodemailer.getTestMessageUrl(info));
        }
    })["catch"](function (error) { return console.error('There was an error while sending the email:', error); });
});
exports.shareListWithUsers = functions.https.onRequest(function (req, res) {
    req.body.users.forEach(function (user) {
        admin.firestore().collection('/invites/').add({ to: user.email });
    });
    res.status(200).send();
});
