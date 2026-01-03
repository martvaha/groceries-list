import nodemailer, { SendMailOptions } from 'nodemailer';
import { TemplateDelegate } from 'handlebars';
import fs from 'fs';
import path from 'path';
import util from 'util';
import mjml2html from 'mjml';
import { convert } from 'html-to-text';
import { handlebars } from './handlebars.js';
import { Dict } from './types.js';
import { APP_ROOT, CONFIG } from '../config.js';
import Sentry from './sentry.js';

const templateCache: Dict<{
  compileHtml: TemplateDelegate;
  compileText: TemplateDelegate;
}> = {};

const readFilePromise = util.promisify(fs.readFile);

const transporter = nodemailer.createTransport(CONFIG.smtpConfig as nodemailer.TransportOptions);

async function compileTemplate<T = unknown>(
  template: string,
  data?: T
): Promise<{ html?: string; text?: string; error?: unknown }> {
  try {
    let { compileHtml, compileText } =
      templateCache[template.toLowerCase()] || {};
    if (compileHtml === undefined || compileText === undefined) {
      const mjml = await readFilePromise(
        path.join(APP_ROOT, 'views', 'email', template + '.mjml'),
        'utf-8'
      );
      const { html: htmlTemplate, errors: mjmlErrors } = mjml2html(mjml);
      if (mjmlErrors && mjmlErrors.length) {
        Sentry.captureException(mjmlErrors);
      }
      const textTemplate: string = convert(htmlTemplate);
      compileHtml = handlebars.compile<T>(htmlTemplate);
      compileText = handlebars.compile<T>(textTemplate);
      if (!CONFIG.disableTemplateCache) {
        templateCache[template.toLocaleLowerCase()] = {
          compileHtml,
          compileText,
        };
      }
    }
    const html = compileHtml(data);
    const text = compileText(data);
    return { html, text };
  } catch (error) {
    Sentry.captureException(error);
    return { error };
  }
}

/**
 * Sends out email inside a pool and ratelimiting the sending to avoid getting blocked.
 * @param template template name without extension
 */
export async function sendMail<T = unknown>(
  options: SendMailOptions,
  template: string,
  data?: T
) {
  if (!CONFIG.sendEmail) return;
  const { html, text, error } = await compileTemplate(template, data);
  if (error) throw error;

  const message: SendMailOptions = { html, text, ...options };

  if (CONFIG.sendEmailTo.length) {
    message.to = CONFIG.sendEmailTo;
  }

  try {
    const info = await transporter.sendMail(message);
    console.log(`Email sent to "${message.to}"`);
    if (CONFIG.smtpConfig.host === 'smtp.ethereal.email') {
      console.log('Preview: ' + nodemailer.getTestMessageUrl(info as nodemailer.SentMessageInfo));
    }
  } catch (error) {
    Sentry.captureException(error);
  }
}
