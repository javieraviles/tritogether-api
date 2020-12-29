import { createTransport, SendMailOptions } from "nodemailer";
import { config } from "../config";

export default class EmailService {

    public static async sendPasswordRecoveryEmail(tmpPassword: string, recipient: string) {

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
        const body = `Your temporary password is ${tmpPassword}, please go to the link`;

        await transporter.sendMail(EmailService.composeEmail(from, recipient, subject, body));
    }

    private static composeEmail(from: string, recipient: string, subject: string, body: string): SendMailOptions {
        return {
            from: from,
            to: recipient,
            subject: subject,
            text: body
        };

    }

}