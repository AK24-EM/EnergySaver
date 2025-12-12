import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';

class EmailService {
    constructor() {
        // Create reusable transporter object using the default SMTP transport
        // For development, we'll log the configuration. In production, these should be env vars.
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: process.env.SMTP_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER || 'ethereal_user',
                pass: process.env.SMTP_PASS || 'ethereal_pass'
            }
        });
    }

    async sendEmail(to, subject, html) {
        try {
            const info = await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || '"EnergySaver Pro" <noreply@energysaver.com>',
                to,
                subject,
                html
            });

            logger.info(`Message sent: ${info.messageId}`);
            if (process.env.NODE_ENV !== 'production' && nodemailer.getTestMessageUrl(info)) {
                logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
            }
            return info;
        } catch (error) {
            logger.error('Error sending email:', error);
            throw error;
        }
    }

    async sendWelcomeEmail(user) {
        const subject = 'Welcome to EnergySaver Pro!';
        const html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h1>Welcome, ${user.name}!</h1>
                <p>Thank you for joining EnergySaver Pro. We are excited to help you optimize your energy usage.</p>
                <p>Get started by setting up your home profile and devices.</p>
                <br>
                <p>Best regards,</p>
                <p>The EnergySaver Team</p>
            </div>
        `;
        return this.sendEmail(user.email, subject, html);
    }

    async sendAlertEmail(user, alert) {
        const subject = `Alert: ${alert.title}`;
        const html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2 style="color: #d32f2f;">${alert.title}</h2>
                <p><strong>Severity:</strong> ${alert.severity}</p>
                <p>${alert.message}</p>
                <p>Time: ${new Date().toLocaleString()}</p>
                <br>
                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" style="background: #1a73e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Dashboard</a>
            </div>
        `;
        return this.sendEmail(user.email, subject, html);
    }
}

export default new EmailService();
