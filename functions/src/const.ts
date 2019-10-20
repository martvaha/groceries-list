import { config } from "firebase-functions";
export const APP_ROOT = __dirname;

const configDefaults = {
  sentry: {
    dsn: "",
    enabled: false
  },
  baseDomain: "https://groceries-list.com",
  sendEmail: true,
  sendEmailTo: ["martvaha@gmail.com"],
  disableTemplateCache: false,
  smtpConfig: {
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: "deangelo.reinger5@ethereal.email",
      pass: "9mF37NSXzgVaARkyAs"
    }
  }
};

export const CONFIG: typeof configDefaults = Object.assign(
  configDefaults,
  config()
);
