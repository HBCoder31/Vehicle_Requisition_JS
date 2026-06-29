const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

class EmailService {
  /**
   * Send an HTML email via Brevo.
   * @param {string} to - recipient email
   * @param {string} subject - email subject
   * @param {string} htmlBody - full HTML content
   * @param {Array}  inlineAttachments - optional array of { name, content (base64), cid } for inline images
   */
  async sendEmail(to, subject, htmlBody, inlineAttachments = []) {
    if (!to) {
      console.log('No recipient email found');
      return;
    }

    try {
      console.log(`Sending email to: ${to}`);

      const payload = {
        sender: {
          name: 'Vehicle Requisition Travel Portal',
          email: process.env.SMTP_FROM || 'guest@opil.in'
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlBody
      };

      // Attach inline images if provided (for CID embedding)
      if (inlineAttachments && inlineAttachments.length > 0) {
        payload.attachment = inlineAttachments.map(att => ({
          name: att.name,
          content: att.content  // base64 string
        }));
      }

      const response = await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        payload,
        {
          headers: {
            'api-key': process.env.BREVO_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('Brevo Email Sent:', response.data);

      await this._logEmail(to, subject, htmlBody, 'Sent');

    } catch (err) {
      console.error('Brevo Email Failed:', err.response?.data || err.message);
      await this._logEmail(
        to, subject, htmlBody, 'Failed',
        JSON.stringify(err.response?.data || err.message)
      );
    }
  }

  async _logEmail(to, subject, body, status, errorMessage = null) {
    try {
      await pool.execute(
        `INSERT INTO email_logs (to_email, subject, body, status, error_message) VALUES (?, ?, ?, ?, ?)`,
        [to, subject, body, status, errorMessage]
      );
    } catch (err) {
      console.error('Failed to log email:', err);
    }
  }
}

module.exports = new EmailService();