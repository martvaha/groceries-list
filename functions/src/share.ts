import * as functions from "firebase-functions";
import * as nodemailer from "nodemailer";
import { SendMailOptions } from "nodemailer";
import { admin } from "./admin";
import { User } from "./model";
import { sendMail } from "./utils/email";
import { CONFIG } from "./const";

// Sends an email when a list is being shared
export const sendEmail = functions.firestore
  .document("/invites/{uid}")
  .onCreate(async event => {
    const shareObject = event.data();

    if (!(shareObject && shareObject.to)) return true;

    const mailOptions: SendMailOptions = {
      subject: "Nimekirja jagamine",
      from: '"Groceries List" <info@mg.groceries-list.com>',
      to: shareObject.to
    };

    try {
      await sendMail(mailOptions, "share", {
        userName: "Märt Vaha",
        listName: 'Test nimekiri',
        baseDomain: CONFIG.baseDomain,
        sharePath: 'share',
        shareToken: event.id,
      });
      return true;
    } catch (error) {
      console.error("There was an error while sending the email:", error);
      throw error;
    }
  });

export const shareListWithUsers = functions.https.onRequest((req, res) => {
  req.body.users.forEach((user: User) => {
    admin
      .firestore()
      .collection("/invites/")
      .add({ to: user.email });
  });
  res.status(200).send();
});
