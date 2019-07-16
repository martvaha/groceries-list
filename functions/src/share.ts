import * as functions from 'firebase-functions';
import * as nodemailer from 'nodemailer';
import { SendMailOptions } from 'nodemailer';
import * as admin from 'firebase-admin';

// Sends an email when a list is being shared
export const sendEmail = functions.firestore.document('/invites/{uid}').onCreate(event => {
  const shareObject = event.data();
  console.log(shareObject);

  if (!(shareObject && shareObject.to)) return Promise.resolve(true);

  const mailOptions: SendMailOptions = {
    subject: 'Listi jagamine',
    text: 'Test email',
    from: '"Groceries List" <info@groceries-list.com>',
    to: shareObject.to
  };

  const emailConfig = functions.config().email;
  let mailTransportConfig = {};
  if (emailConfig.service === 'test') {
    mailTransportConfig = {
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: 'deangelo.reinger5@ethereal.email', pass: '9mF37NSXzgVaARkyAs' }
    };
  } else {
    mailTransportConfig = {
      service: emailConfig.service,
      auth: { user: emailConfig.user, pass: emailConfig.pass }
    };
  }

  const mailTransport = nodemailer.createTransport(mailTransportConfig);

  return mailTransport
    .sendMail(mailOptions)
    .then(info => {
      console.log('Email sent');
      if (emailConfig.service === 'test') {
        console.log('Preview: ' + nodemailer.getTestMessageUrl(info));
      }
    })
    .catch(error => console.error('There was an error while sending the email:', error));
});

export const shareListWithUsers = functions.https.onRequest((req, res) => {
  req.body.users.forEach(user => {
    admin
      .firestore()
      .collection('/invites/')
      .add({ to: user.email });
  });
  res.status(200).send();
});
