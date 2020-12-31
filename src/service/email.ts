import { createTransport, SendMailOptions } from "nodemailer";
import { config } from "../config";

export default class EmailService {

    public static sendPasswordRecoveryEmail(tmpPassword: string, recipient: string): Promise<any> {
        const transporter = createTransport({
            host: config.supportEmail.smtpServer,
            port: 465,
            secure: true,
            auth: {
                user: config.supportEmail.user,
                pass: config.supportEmail.password
            },
        });

        const from = `"TriTogether Support\" <${config.supportEmail.user}>`;
        const subject = "TriTogether password recovery";
        const body = `Your temporary code is ${tmpPassword}, please enter it to set a new password`;
        const htmlBody = `Your temporary code is ${tmpPassword}, please go to <a target="_blank" href="https://www.tritogether.net/passwordReset;temporaryCode=${tmpPassword};email=${recipient}">the following  link</a> to set a new password`;
        return transporter.sendMail(EmailService.composeEmail(from, recipient, subject, body, htmlBody));
    }

    private static composeEmail(from: string, recipient: string, subject: string, body: string, htmlBody: string): SendMailOptions {
        return {
            from: from,
            to: recipient,
            subject: subject,
            text: body,
            html: htmlBody
        };

    }

}