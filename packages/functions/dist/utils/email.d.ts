import { SendMailOptions } from 'nodemailer';
/**
 * Sends out email inside a pool and ratelimiting the sending to avoid getting blocked.
 * @param template template name without extension
 */
export declare function sendMail<T = unknown>(options: SendMailOptions, template: string, data?: T): Promise<void>;
