/**
 * EmailApprovalService
 * 
 * Handles secure token generation, professional HTML email building,
 * and orchestration for email-based approval/rejection of vehicle requests.
 */
const crypto = require('crypto');
const path = require('path');
const { pool } = require('../config/db');
const EmailService = require('./EmailService');
const RequestRepository = require('../repositories/RequestRepository');
const UserRepository = require('../repositories/UserRepository');

const TOKEN_EXPIRY_HOURS = 48;

// Logo URL — served from the server's /uploads directory
function getLogoUrl() {
  const base = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${base}/uploads/logo.png`;
}

class EmailApprovalService {

  // ─── TOKEN MANAGEMENT ───────────────────────────────────────

  /**
   * Generate a cryptographically secure approval token and store it in DB.
   * @returns {string} The raw token string (128 hex chars)
   */
  async generateToken(requestId, approverId, stage) {
    const token = crypto.randomBytes(64).toString('hex'); // 128 hex chars
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

    await pool.execute(
      `INSERT INTO email_approval_tokens (token, request_id, approver_id, approval_stage, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [token, requestId, approverId, stage, expiresAt]
    );

    return token;
  }

  /**
   * Validate a token and return its details WITHOUT consuming it.
   * Used for the rejection form page (show form first, consume on submit).
   */
  async validateToken(token) {
    const [rows] = await pool.execute(
      `SELECT eat.*, e.full_name AS approver_name, e.email AS approver_email, e.role AS approver_role
       FROM email_approval_tokens eat
       JOIN employees e ON eat.approver_id = e.id
       WHERE eat.token = ?`,
      [token]
    );

    if (rows.length === 0) {
      return { valid: false, error: 'Invalid or unknown approval token.', code: 'INVALID_TOKEN' };
    }

    const tokenRecord = rows[0];

    if (tokenRecord.is_used) {
      return { valid: false, error: 'This approval link has already been used.', code: 'ALREADY_USED', data: tokenRecord };
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
      return { valid: false, error: 'This approval link has expired. Please use the website to approve.', code: 'EXPIRED', data: tokenRecord };
    }

    // Verify request still exists and is at the correct stage
    const request = await RequestRepository.getRequestById(tokenRecord.request_id);
    if (!request) {
      return { valid: false, error: 'The associated request no longer exists.', code: 'REQUEST_NOT_FOUND' };
    }

    const expectedStatus = this._getExpectedStatus(tokenRecord.approval_stage);
    if (request.status !== expectedStatus) {
      return { valid: false, error: `This request is no longer at the ${tokenRecord.approval_stage} approval stage. Current status: ${request.status.replace(/_/g, ' ')}.`, code: 'WRONG_STAGE', data: tokenRecord };
    }

    return { valid: true, tokenRecord, request };
  }

  /**
   * Validate and consume a token (mark as used). Returns same as validateToken.
   */
  async validateAndConsumeToken(token, action, ipAddress, userAgent) {
    const result = await this.validateToken(token);
    if (!result.valid) return result;

    // Mark as used atomically
    const [updateResult] = await pool.execute(
      `UPDATE email_approval_tokens 
       SET is_used = 1, used_at = NOW(), action = ?, ip_address = ?, user_agent = ?
       WHERE token = ? AND is_used = 0`,
      [action, ipAddress || null, userAgent || null, token]
    );

    if (updateResult.affectedRows === 0) {
      // Race condition: another click consumed it between validate and consume
      return { valid: false, error: 'This approval link has already been used.', code: 'ALREADY_USED' };
    }

    return result;
  }

  /**
   * Map approval stage to expected request status
   */
  _getExpectedStatus(stage) {
    const map = {
      'HOD': 'Pending_HOD',
      'GM-HR': 'Pending_GM_HR',
      'COO': 'Pending_COO'
    };
    return map[stage] || null;
  }

  // ─── EMAIL ORCHESTRATION ────────────────────────────────────

  /**
   * Send a rich HTML approval email with Approve/Reject buttons to an approver.
   */
  async sendApprovalEmail(requestId, approverId, stage, baseUrl = null) {
    try {
      const request = await RequestRepository.getRequestById(requestId);
      if (!request) {
        console.error(`EmailApproval: Request ${requestId} not found`);
        return;
      }

      const approver = await UserRepository.findById(approverId);
      if (!approver || !approver.email) {
        console.error(`EmailApproval: Approver ${approverId} not found or has no email`);
        return;
      }

      // Generate two separate tokens — one for approve, one for reject
      const approveToken = await this.generateToken(requestId, approverId, stage);
      const rejectToken = await this.generateToken(requestId, approverId, stage);

      const base = baseUrl || process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
      const approveUrl = `${base}/api/email/approve/${approveToken}`;
      const rejectUrl = `${base}/api/email/reject/${rejectToken}`;

      console.log(`[DEBUG TRACE] Email Sent Metadata:
Request ID: ${requestId}
Approval Stage: ${stage}
Approver ID: ${approverId}
Approve Token: ${approveToken}
Reject Token: ${rejectToken}
Approve URL: ${approveUrl}
Reject URL: ${rejectUrl}
Recipient Email: ${approver.email}`);

      const html = this._buildApprovalEmailHtml(request, approver.full_name, stage, approveUrl, rejectUrl);

      await EmailService.sendEmail(
        approver.email,
        `🚗 Action Required: Vehicle Request #${requestId} — ${request.requester_name || 'Employee'}`,
        html
      );

      console.log(`EmailApproval: Sent approval email for Request #${requestId} to ${approver.email} (${stage})`);
    } catch (err) {
      console.error('EmailApproval: Failed to send approval email:', err);
    }
  }

  // ─── HTML EMAIL TEMPLATE ────────────────────────────────────

  /**
   * Build a professional HTML email template using tables for Outlook compatibility.
   */
  _buildApprovalEmailHtml(request, approverName, stage, approveUrl, rejectUrl) {
    const formatDate = (d) => {
      if (!d) return 'N/A';
      const date = new Date(d);
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatTime = (t) => {
      if (!t) return 'N/A';
      if (typeof t === 'string' && t.includes(':')) {
        const [h, m] = t.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h12 = hour % 12 || 12;
        return `${h12}:${m} ${ampm}`;
      }
      return t;
    };

    const stageLabel = stage === 'GM-HR' ? 'GM-HR' : stage;
    const statusColor = '#e67e22';
    const travelType = request.travel_type || 'N/A';
    const workType = request.work_type === 'Personal' ? 'Personal Work' : "Company's Work";

    return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Vehicle Requisition — Action Required</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    @media only screen and (max-width: 620px) {
      .wrapper { width: 100% !important; }
      .mobile-padding { padding: 15px !important; }
      .mobile-btn { display: block !important; width: 100% !important; margin-bottom: 10px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">

<!-- Outer Wrapper -->
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f0f2f5;">
  <tr>
    <td align="center" style="padding:20px 10px;">

      <!-- Email Container -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="wrapper" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a365d 0%,#2b6cb0 100%);padding:0;">
            <!--[if mso]>
            <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:80px;">
              <v:fill type="gradient" color="#1a365d" color2="#2b6cb0" angle="135"/>
              <v:textbox inset="25px,20px,25px,20px">
            <![endif]-->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="padding:22px 30px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px;vertical-align:middle;">
                        🚗 VRTP
                      </td>
                      <td align="right" style="vertical-align:middle;">
                        <img src="${getLogoUrl()}" alt="CK Birla Group" width="120" style="display:block;max-height:44px;width:auto;border:0;outline:none;text-decoration:none;" />
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <!--[if mso]>
              </v:textbox>
            </v:rect>
            <![endif]-->
          </td>
        </tr>

        <!-- TITLE SECTION -->
        <tr>
          <td style="padding:28px 30px 10px 30px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="font-size:22px;font-weight:700;color:#1a202c;line-height:1.3;">
                  Vehicle Requisition — Action Required
                </td>
              </tr>
              <tr>
                <td style="padding-top:8px;font-size:14px;color:#718096;line-height:1.5;">
                  Dear <strong style="color:#2d3748;">${approverName}</strong>, a vehicle requisition request requires your approval as <strong style="color:#2b6cb0;">${stageLabel}</strong>.
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- DIVIDER -->
        <tr>
          <td style="padding:0 30px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr><td style="border-bottom:2px solid #e2e8f0;height:1px;font-size:1px;line-height:1px;">&nbsp;</td></tr>
            </table>
          </td>
        </tr>

        <!-- REQUEST DETAILS TABLE -->
        <tr>
          <td style="padding:20px 30px;" class="mobile-padding">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
              <!-- Table Header -->
              <tr>
                <td colspan="2" style="background-color:#edf2f7;padding:12px 16px;font-size:13px;font-weight:700;color:#4a5568;text-transform:uppercase;letter-spacing:1px;">
                  📋 Request Details
                </td>
              </tr>
              ${this._buildDetailRow('Request Number', `#${request.id}`, '#fff')}
              ${this._buildDetailRow('Employee Name', request.requester_name || 'N/A', '#f7fafc')}
              ${this._buildDetailRow('Employee Email', request.requester_email || 'N/A', '#fff')}
              ${this._buildDetailRow('Department', request.department_name || 'N/A', '#f7fafc')}
              ${this._buildDetailRow('Designation', request.requester_role || 'N/A', '#fff')}
              ${this._buildDetailRow('Purpose', request.purpose || 'N/A', '#f7fafc')}
              ${this._buildDetailRow('Pickup Location', request.pickup_location || 'N/A', '#fff')}
              ${this._buildDetailRow('Destination', request.destination || 'N/A', '#f7fafc')}
              ${this._buildDetailRow('Journey Date', formatDate(request.travel_date), '#fff')}
              ${this._buildDetailRow('Journey Time', formatTime(request.travel_time), '#f7fafc')}
              ${this._buildDetailRow('Return Date', request.return_date ? formatDate(request.return_date) : 'N/A', '#fff')}
              ${this._buildDetailRow('Travel Type', travelType, '#f7fafc')}
              ${this._buildDetailRow('Work Type', workType, '#fff')}
              ${this._buildDetailRow('Passengers', String(request.passengers || 1), '#f7fafc')}
              <!-- Status Row with Color -->
              <tr>
                <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#4a5568;width:40%;border-bottom:1px solid #e2e8f0;background-color:#fff;">
                  Current Status
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#1a202c;border-bottom:1px solid #e2e8f0;background-color:#fff;">
                  <span style="background-color:${statusColor};color:#fff;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;">
                    ${(request.status || '').replace(/_/g, ' ')}
                  </span>
                </td>
              </tr>
              ${this._buildDetailRow('Approval Stage', stageLabel + ' Approval', '#f7fafc')}
            </table>
          </td>
        </tr>

        <!-- ACTION MESSAGE -->
        <tr>
          <td style="padding:0 30px 10px 30px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#ebf8ff;border-radius:6px;border:1px solid #bee3f8;">
              <tr>
                <td style="padding:14px 18px;font-size:13px;color:#2b6cb0;line-height:1.5;">
                  <strong>ℹ️ Action Required:</strong> Please review the details above and click one of the buttons below to approve or reject this request directly from your email.
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- APPROVE / REJECT BUTTONS -->
        <tr>
          <td style="padding:15px 30px 25px 30px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <!-- APPROVE BUTTON -->
                <td align="center" width="48%" class="mobile-btn">
                  <!--[if mso]>
                  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
                    href="${approveUrl}" style="height:48px;v-text-anchor:middle;width:250px;" arcsize="10%"
                    strokecolor="#38a169" fillcolor="#38a169">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:'Segoe UI',sans-serif;font-size:16px;font-weight:bold;">
                      ✅ APPROVE
                    </center>
                  </v:roundrect>
                  <![endif]-->
                  <!--[if !mso]><!-->
                  <a href="${approveUrl}" target="_blank" style="display:inline-block;background-color:#38a169;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:6px;min-width:200px;text-align:center;mso-hide:all;">
                    ✅&nbsp; APPROVE
                  </a>
                  <!--<![endif]-->
                </td>

                <!-- Spacer -->
                <td width="4%">&nbsp;</td>

                <!-- REJECT BUTTON -->
                <td align="center" width="48%" class="mobile-btn">
                  <!--[if mso]>
                  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
                    href="${rejectUrl}" style="height:48px;v-text-anchor:middle;width:250px;" arcsize="10%"
                    strokecolor="#e53e3e" fillcolor="#e53e3e">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:'Segoe UI',sans-serif;font-size:16px;font-weight:bold;">
                      ❌ REJECT
                    </center>
                  </v:roundrect>
                  <![endif]-->
                  <!--[if !mso]><!-->
                  <a href="${rejectUrl}" target="_blank" style="display:inline-block;background-color:#e53e3e;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:6px;min-width:200px;text-align:center;mso-hide:all;">
                    ❌&nbsp; REJECT
                  </a>
                  <!--<![endif]-->
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- WEBSITE LINK -->
        <tr>
          <td style="padding:0 30px 20px 30px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f7fafc;border-radius:6px;border:1px solid #e2e8f0;">
              <tr>
                <td style="padding:12px 18px;font-size:12px;color:#718096;line-height:1.5;text-align:center;">
                  You can also approve or reject this request by logging into the
                  <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="color:#2b6cb0;text-decoration:underline;font-weight:600;">VRTP Portal</a>.
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background-color:#1a365d;padding:20px 30px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
              <tr>
                <td style="font-size:11px;color:rgba(255,255,255,0.7);line-height:1.5;">
                  This is an automated email from the Vehicle Requisition Travel Portal (VRTP).<br/>
                  Please do not reply to this email. Approval links expire after ${TOKEN_EXPIRY_HOURS} hours.<br/>
                  &copy; ${new Date().getFullYear()} CK Birla Group &bull; Orient Paper &amp; Industries Ltd.
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
      <!-- /Email Container -->

    </td>
  </tr>
</table>
<!-- /Outer Wrapper -->

</body>
</html>`;
  }

  /**
   * Helper: Build a single detail row for the request details table
   */
  _buildDetailRow(label, value, bgColor) {
    return `
              <tr>
                <td style="padding:10px 16px;font-size:13px;font-weight:600;color:#4a5568;width:40%;border-bottom:1px solid #e2e8f0;background-color:${bgColor};">
                  ${label}
                </td>
                <td style="padding:10px 16px;font-size:13px;color:#1a202c;border-bottom:1px solid #e2e8f0;background-color:${bgColor};">
                  ${value}
                </td>
              </tr>`;
  }

  // ─── RESPONSE HTML PAGES ────────────────────────────────────

  /**
   * Build HTML success page for approval
   */
  buildApprovalSuccessPage(request, approverName, stage) {
    return this._buildResponsePage({
      title: 'Request Approved Successfully',
      icon: '✅',
      themeColor: '#38a169',
      themeBg: '#f0fff4',
      themeBorder: '#c6f6d5',
      requestId: request.id,
      employeeName: request.requester_name,
      actionBy: approverName,
      stage: stage,
      message: `Vehicle Request #${request.id} has been approved at the ${stage} level. The request will now move to the next stage in the approval workflow.`
    });
  }

  /**
   * Build HTML success page for rejection
   */
  buildRejectionSuccessPage(request, approverName, stage, remarks) {
    return this._buildResponsePage({
      title: 'Request Rejected',
      icon: '❌',
      themeColor: '#e53e3e',
      themeBg: '#fff5f5',
      themeBorder: '#fed7d7',
      requestId: request.id,
      employeeName: request.requester_name,
      actionBy: approverName,
      stage: stage,
      message: `Vehicle Request #${request.id} has been rejected at the ${stage} level.${remarks ? ' Remarks: ' + remarks : ''}`,
      remarks: remarks
    });
  }

  /**
   * Build HTML for the rejection remarks form
   */
  buildRejectionFormPage(request, approverName, stage, token) {
    const actionUrl = `${process.env.API_BASE_URL || 'http://localhost:' + (process.env.PORT || 5000)}/api/email/reject/${token}`;
    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reject Request — VRTP</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f2f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); max-width: 540px; width: 100%; overflow: hidden; }
    .header { background: linear-gradient(135deg, #1a365d, #2b6cb0); padding: 20px 28px; color: #fff; }
    .header h1 { font-size: 18px; font-weight: 700; } .header p { font-size: 12px; opacity: 0.8; margin-top: 4px; }
    .body { padding: 28px; }
    .alert { background: #fff5f5; border: 1px solid #fed7d7; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; }
    .alert-title { font-size: 14px; font-weight: 700; color: #e53e3e; margin-bottom: 4px; }
    .alert-text { font-size: 13px; color: #742a2a; line-height: 1.5; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
    .info-item { background: #f7fafc; border-radius: 6px; padding: 10px 14px; }
    .info-label { font-size: 10px; text-transform: uppercase; font-weight: 700; color: #718096; letter-spacing: 0.5px; }
    .info-value { font-size: 14px; font-weight: 600; color: #1a202c; margin-top: 2px; }
    label { display: block; font-size: 13px; font-weight: 600; color: #4a5568; margin-bottom: 6px; }
    textarea { width: 100%; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px; font-family: inherit; resize: vertical; min-height: 100px; outline: none; transition: border-color 0.2s; }
    textarea:focus { border-color: #e53e3e; box-shadow: 0 0 0 3px rgba(229,62,62,0.1); }
    .actions { display: flex; gap: 12px; margin-top: 20px; }
    .btn { padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 700; border: none; cursor: pointer; text-decoration: none; text-align: center; flex: 1; transition: opacity 0.2s; }
    .btn:hover { opacity: 0.9; }
    .btn-reject { background: #e53e3e; color: #fff; }
    .btn-cancel { background: #edf2f7; color: #4a5568; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .footer { padding: 16px 28px; background: #f7fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #a0aec0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>🚗 VRTP — Reject Vehicle Request</h1>
      <p>CK Birla Group &bull; Orient Paper & Industries</p>
    </div>
    <div class="body">
      <div class="alert">
        <div class="alert-title">⚠️ You are about to reject this request</div>
        <div class="alert-text">Please provide your remarks below. This action cannot be undone.</div>
      </div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Request #</div>
          <div class="info-value">${request.id}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Employee</div>
          <div class="info-value">${request.requester_name || 'N/A'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Destination</div>
          <div class="info-value">${request.destination || 'N/A'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Rejecting As</div>
          <div class="info-value">${stage}</div>
        </div>
      </div>
      <form method="POST" action="${actionUrl}" id="rejectForm">
        <label for="remarks">Rejection Remarks</label>
        <textarea id="remarks" name="remarks" placeholder="Enter your reason for rejecting this request..."></textarea>
        <div class="actions">
          <button type="submit" class="btn btn-reject" id="submitBtn" onclick="this.disabled=true;this.textContent='Submitting...';document.getElementById('rejectForm').submit();">
            ❌ Confirm Rejection
          </button>
        </div>
      </form>
    </div>
    <div class="footer">
      VRTP &bull; Vehicle Requisition Travel Portal &bull; ${now}
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Build HTML for the approval confirmation form
   */
  buildApprovalFormPage(request, approverName, stage, token) {
    const actionUrl = `${process.env.API_BASE_URL || 'http://localhost:' + (process.env.PORT || 5000)}/api/email/approve/${token}`;
    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Approve Request — VRTP</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f2f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); max-width: 540px; width: 100%; overflow: hidden; }
    .header { background: linear-gradient(135deg, #1a365d, #2b6cb0); padding: 20px 28px; color: #fff; }
    .header h1 { font-size: 18px; font-weight: 700; } .header p { font-size: 12px; opacity: 0.8; margin-top: 4px; }
    .body { padding: 28px; }
    .alert { background: #f0fff4; border: 1px solid #c6f6d5; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; }
    .alert-title { font-size: 14px; font-weight: 700; color: #38a169; margin-bottom: 4px; }
    .alert-text { font-size: 13px; color: #22543d; line-height: 1.5; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
    .info-item { background: #f7fafc; border-radius: 6px; padding: 10px 14px; }
    .info-label { font-size: 10px; text-transform: uppercase; font-weight: 700; color: #718096; letter-spacing: 0.5px; }
    .info-value { font-size: 14px; font-weight: 600; color: #1a202c; margin-top: 2px; }
    .actions { display: flex; gap: 12px; margin-top: 20px; }
    .btn { padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 700; border: none; cursor: pointer; text-decoration: none; text-align: center; flex: 1; transition: opacity 0.2s; }
    .btn:hover { opacity: 0.9; }
    .btn-approve { background: #38a169; color: #fff; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .footer { padding: 16px 28px; background: #f7fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #a0aec0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>🚗 VRTP — Approve Vehicle Request</h1>
      <p>CK Birla Group &bull; Orient Paper & Industries</p>
    </div>
    <div class="body">
      <div class="alert">
        <div class="alert-title">✅ You are about to approve this request</div>
        <div class="alert-text">Click the button below to confirm and finalize your approval.</div>
      </div>
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Request #</div>
          <div class="info-value">${request.id}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Employee</div>
          <div class="info-value">${request.requester_name || 'N/A'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Destination</div>
          <div class="info-value">${request.destination || 'N/A'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Approving As</div>
          <div class="info-value">${stage}</div>
        </div>
      </div>
      <form method="POST" action="${actionUrl}" id="approveForm">
        <div class="actions">
          <button type="submit" class="btn btn-approve" id="submitBtn" onclick="this.disabled=true;this.textContent='Processing...';document.getElementById('approveForm').submit();">
            ✅ Confirm Approval
          </button>
        </div>
      </form>
    </div>
    <div class="footer">
      VRTP &bull; Vehicle Requisition Travel Portal &bull; ${now}
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Build error/warning page for invalid, expired, or already-used tokens
   */
  buildErrorPage(errorMessage, code) {
    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const portalUrl = process.env.CLIENT_URL || 'http://localhost:5173';

    let icon = '⚠️';
    let themeColor = '#d69e2e';
    let themeBg = '#fffff0';
    if (code === 'ALREADY_USED') { icon = '🔒'; themeColor = '#718096'; themeBg = '#f7fafc'; }
    if (code === 'EXPIRED') { icon = '⏰'; }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Action Failed — VRTP</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f2f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); max-width: 480px; width: 100%; overflow: hidden; text-align: center; }
    .header { background: linear-gradient(135deg, #1a365d, #2b6cb0); padding: 20px 28px; color: #fff; }
    .header h1 { font-size: 16px; font-weight: 700; }
    .body { padding: 40px 28px; }
    .icon { font-size: 56px; margin-bottom: 16px; }
    .title { font-size: 20px; font-weight: 700; color: ${themeColor}; margin-bottom: 12px; }
    .message { font-size: 14px; color: #4a5568; line-height: 1.6; margin-bottom: 24px; background: ${themeBg}; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .portal-link { display: inline-block; background: #2b6cb0; color: #fff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; }
    .portal-link:hover { opacity: 0.9; }
    .footer { padding: 16px; background: #f7fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #a0aec0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header"><h1>🚗 VRTP — Vehicle Requisition Travel Portal</h1></div>
    <div class="body">
      <div class="icon">${icon}</div>
      <div class="title">Action Could Not Be Completed</div>
      <div class="message">${errorMessage}</div>
      <a href="${portalUrl}" class="portal-link">Open VRTP Portal →</a>
    </div>
    <div class="footer">&copy; ${new Date().getFullYear()} CK Birla Group &bull; Orient Paper &amp; Industries &bull; ${now}</div>
  </div>
</body>
</html>`;
  }

  /**
   * Internal helper: Build success/failure response page
   */
  _buildResponsePage({ title, icon, themeColor, themeBg, themeBorder, requestId, employeeName, actionBy, stage, message, remarks }) {
    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — VRTP</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f0f2f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #fff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); max-width: 500px; width: 100%; overflow: hidden; text-align: center; }
    .header { background: linear-gradient(135deg, #1a365d, #2b6cb0); padding: 20px 28px; color: #fff; }
    .header h1 { font-size: 16px; font-weight: 700; } .header p { font-size: 12px; opacity: 0.8; margin-top: 4px; }
    .body { padding: 36px 28px; }
    .icon { font-size: 64px; margin-bottom: 16px; }
    .title { font-size: 22px; font-weight: 700; color: ${themeColor}; margin-bottom: 16px; }
    .details { background: ${themeBg}; border: 1px solid ${themeBorder}; border-radius: 8px; padding: 20px; margin-bottom: 20px; text-align: left; }
    .detail-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px solid ${themeBorder}; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-weight: 600; color: #4a5568; }
    .detail-value { color: #1a202c; font-weight: 500; }
    .message { font-size: 14px; color: #4a5568; line-height: 1.6; margin-bottom: 20px; }
    .close-msg { font-size: 12px; color: #a0aec0; }
    .footer { padding: 16px; background: #f7fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #a0aec0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>🚗 VRTP — Vehicle Requisition Travel Portal</h1>
      <p>CK Birla Group &bull; Orient Paper & Industries</p>
    </div>
    <div class="body">
      <div class="icon">${icon}</div>
      <div class="title">${title}</div>
      <div class="details">
        <div class="detail-row"><span class="detail-label">Request Number</span><span class="detail-value">#${requestId}</span></div>
        <div class="detail-row"><span class="detail-label">Employee</span><span class="detail-value">${employeeName || 'N/A'}</span></div>
        <div class="detail-row"><span class="detail-label">Action By</span><span class="detail-value">${actionBy}</span></div>
        <div class="detail-row"><span class="detail-label">Approval Level</span><span class="detail-value">${stage}</span></div>
        <div class="detail-row"><span class="detail-label">Date &amp; Time</span><span class="detail-value">${now}</span></div>
        ${remarks ? `<div class="detail-row"><span class="detail-label">Remarks</span><span class="detail-value">${remarks}</span></div>` : ''}
      </div>
      <p class="message">${message}</p>
      <p class="close-msg">You may now close this tab.</p>
    </div>
    <div class="footer">&copy; ${new Date().getFullYear()} CK Birla Group &bull; Orient Paper &amp; Industries</div>
  </div>
</body>
</html>`;
  }
}

module.exports = new EmailApprovalService();
