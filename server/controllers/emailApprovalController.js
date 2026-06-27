/**
 * Email Approval Controller
 * 
 * Handles GET/POST endpoints for email-based approve/reject actions.
 * These are PUBLIC endpoints — secured by cryptographic tokens, not JWT.
 */
const ApprovalService = require('../services/ApprovalService');
const EmailApprovalService = require('../services/EmailApprovalService');
const AuditRepository = require('../repositories/AuditRepository');

/**
 * GET /api/email/approve/:token
 * 
 * Called when approver clicks the green "APPROVE" button in email.
 * Validates token, displays approval confirmation form.
 */
exports.handleApproveForm = async (req, res) => {
  try {
    const { token } = req.params;

    // Validate token (DO NOT consume yet — wait for form confirm click)
    const result = await EmailApprovalService.validateToken(token);

    if (!result.valid) {
      return res.status(400).send(EmailApprovalService.buildErrorPage(result.error, result.code));
    }

    const { tokenRecord, request } = result;
    const approverName = tokenRecord.approver_name || 'Approver';

    // Show approval confirmation form page
    return res.status(200).send(
      EmailApprovalService.buildApprovalFormPage(request, approverName, tokenRecord.approval_stage, token)
    );

  } catch (err) {
    console.error('Email approve form handler error:', err);
    return res.status(500).send(
      EmailApprovalService.buildErrorPage('An unexpected error occurred. Please use the VRTP website.', 'SERVER_ERROR')
    );
  }
};

/**
 * POST /api/email/approve/:token
 * 
 * Called when approver clicks the confirmation button on the page.
 * Validates and consumes token, executes approval via ApprovalService, returns success page.
 */
exports.handleApproveSubmit = async (req, res) => {
  try {
    const { token } = req.params;
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'] || null;

    // Validate and consume token
    const result = await EmailApprovalService.validateAndConsumeToken(token, 'approve', ipAddress, userAgent);

    if (!result.valid) {
      return res.status(400).send(EmailApprovalService.buildErrorPage(result.error, result.code));
    }

    const { tokenRecord, request } = result;
    const { approval_stage, approver_id, request_id } = tokenRecord;

    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://${req.get('host')}`;

    // Execute approval using EXISTING ApprovalService logic
    try {
      if (approval_stage === 'HOD') {
        // HOD needs departmentIds — get from employee record
        const UserRepository = require('../repositories/UserRepository');
        const delegationUtil = require('../utils/delegationUtil');
        const { departmentIds } = await delegationUtil.getEffectivePermissions(approver_id);

        await ApprovalService.hodAction(
          request_id,
          departmentIds,
          'approve',
          'Approved via email',
          approver_id,
          ipAddress,
          baseUrl
        );
      } else if (approval_stage === 'GM-HR') {
        await ApprovalService.gmHrAction(
          request_id,
          'approve',
          'Approved via email',
          approver_id,
          ipAddress,
          baseUrl
        );
      } else if (approval_stage === 'COO') {
        await ApprovalService.cooAction(
          request_id,
          'approve',
          'Approved via email',
          approver_id,
          ipAddress,
          baseUrl
        );
      }
    } catch (approvalErr) {
      console.error('Email approval action failed:', approvalErr);
      return res.status(400).send(
        EmailApprovalService.buildErrorPage(
          approvalErr.message || 'Failed to process approval. Please use the website.',
          'ACTION_FAILED'
        )
      );
    }

    // Audit the email click
    await AuditRepository.createLog(
      approver_id,
      'EMAIL_APPROVE',
      'vehicle_request',
      request_id,
      { stage: approval_stage, method: 'email', ip: ipAddress },
      ipAddress
    );

    // Return success page
    const approverName = tokenRecord.approver_name || 'Approver';
    return res.status(200).send(
      EmailApprovalService.buildApprovalSuccessPage(request, approverName, approval_stage)
    );

  } catch (err) {
    console.error('Email approve submit handler error:', err);
    return res.status(500).send(
      EmailApprovalService.buildErrorPage('An unexpected error occurred. Please use the VRTP website.', 'SERVER_ERROR')
    );
  }
};

/**
 * GET /api/email/reject/:token
 * 
 * Called when approver clicks the red "REJECT" button in email.
 * Shows a rejection form with a remarks textarea.
 * Token is NOT consumed here — it's consumed on form submit (POST).
 */
exports.handleReject = async (req, res) => {
  try {
    const { token } = req.params;

    // Validate token (DO NOT consume yet — wait for form submit)
    const result = await EmailApprovalService.validateToken(token);

    if (!result.valid) {
      return res.status(400).send(EmailApprovalService.buildErrorPage(result.error, result.code));
    }

    const { tokenRecord, request } = result;
    const approverName = tokenRecord.approver_name || 'Approver';

    // Show rejection form
    return res.status(200).send(
      EmailApprovalService.buildRejectionFormPage(request, approverName, tokenRecord.approval_stage, token)
    );

  } catch (err) {
    console.error('Email reject form handler error:', err);
    return res.status(500).send(
      EmailApprovalService.buildErrorPage('An unexpected error occurred. Please use the VRTP website.', 'SERVER_ERROR')
    );
  }
};

/**
 * POST /api/email/reject/:token
 * 
 * Called when approver submits the rejection form with remarks.
 * Validates and consumes token, executes rejection, returns rejection success page.
 */
exports.handleRejectSubmit = async (req, res) => {
  try {
    const { token } = req.params;
    const remarks = req.body?.remarks || 'Rejected via email';
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'] || null;

    // Validate and consume token
    const result = await EmailApprovalService.validateAndConsumeToken(token, 'reject', ipAddress, userAgent);

    if (!result.valid) {
      return res.status(400).send(EmailApprovalService.buildErrorPage(result.error, result.code));
    }

    const { tokenRecord, request } = result;
    const { approval_stage, approver_id, request_id } = tokenRecord;

    // Execute rejection using EXISTING ApprovalService logic
    try {
      if (approval_stage === 'HOD') {
        const delegationUtil = require('../utils/delegationUtil');
        const { departmentIds } = await delegationUtil.getEffectivePermissions(approver_id);

        await ApprovalService.hodAction(
          request_id,
          departmentIds,
          'reject',
          remarks,
          approver_id,
          ipAddress
        );
      } else if (approval_stage === 'GM-HR') {
        await ApprovalService.gmHrAction(
          request_id,
          'reject',
          remarks,
          approver_id,
          ipAddress
        );
      } else if (approval_stage === 'COO') {
        await ApprovalService.cooAction(
          request_id,
          'reject',
          remarks,
          approver_id,
          ipAddress
        );
      }
    } catch (rejectErr) {
      console.error('Email rejection action failed:', rejectErr);
      return res.status(400).send(
        EmailApprovalService.buildErrorPage(
          rejectErr.message || 'Failed to process rejection. Please use the website.',
          'ACTION_FAILED'
        )
      );
    }

    // Audit the email click
    await AuditRepository.createLog(
      approver_id,
      'EMAIL_REJECT',
      'vehicle_request',
      request_id,
      { stage: approval_stage, method: 'email', remarks, ip: ipAddress },
      ipAddress
    );

    // Return rejection success page
    const approverName = tokenRecord.approver_name || 'Approver';
    return res.status(200).send(
      EmailApprovalService.buildRejectionSuccessPage(request, approverName, approval_stage, remarks)
    );

  } catch (err) {
    console.error('Email reject submit handler error:', err);
    return res.status(500).send(
      EmailApprovalService.buildErrorPage('An unexpected error occurred. Please use the VRTP website.', 'SERVER_ERROR')
    );
  }
};


