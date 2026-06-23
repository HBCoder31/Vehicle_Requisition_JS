const nodemailer = require('nodemailer');
const { pool } = require('../config/db');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // Port 587 = false
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async sendEmail(to, subject, htmlBody) {
    if (!to) {
      console.log('No recipient email found');
      return;
    }

    try {
      console.log(`Sending email to: ${to}`);

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        html: htmlBody,
      });

      console.log(`Email sent successfully to ${to}`);

      await this._logEmail(
        to,
        subject,
        htmlBody,
        'Sent'
      );

    } catch (err) {
      console.error('Failed to send email:', err);

      await this._logEmail(
        to,
        subject,
        htmlBody,
        'Failed',
        err.message
      );
    }
  }

  async _logEmail(
    to,
    subject,
    body,
    status,
    errorMessage = null
  ) {
    try {
      await pool.execute(
        `INSERT INTO email_logs
        (to_email, subject, body, status, error_message)
        VALUES (?, ?, ?, ?, ?)`,
        [
          to,
          subject,
          body,
          status,
          errorMessage
        ]
      );
    } catch (err) {
      console.error('Failed to log email:', err);
    }
  }
}

module.exports = new EmailService();