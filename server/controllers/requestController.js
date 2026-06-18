const Joi = require('../utils/joiMock');
const RequestService = require('../services/RequestService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// ─── VALIDATION SCHEMAS ────────────────────────────────────
const createRequestSchema = Joi.object({
  purpose: Joi.string().required(),
  pickup_location: Joi.string().required(),
  destination: Joi.string().required(),
  travel_type: Joi.string().valid('Within Anuppur/Shahdol', 'Beyond Anuppur/Shahdol').required(),
  passengers: Joi.number().integer().min(1).default(1),
  travel_date: Joi.date().iso().required(),
  travel_time: Joi.string().required(),
  return_date: Joi.date().iso().allow(null, ''),
  return_time: Joi.string().allow(null, '')
});

// ─── CREATE REQUEST ────────────────────────────────────────

/**
 * @swagger
 * /api/requests:
 *   post:
 *     summary: Create a new vehicle request
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - purpose
 *               - pickup_location
 *               - destination
 *               - travel_type
 *               - travel_date
 *               - travel_time
 *             properties:
 *               purpose:
 *                 type: string
 *               pickup_location:
 *                 type: string
 *               destination:
 *                 type: string
 *               travel_type:
 *                 type: string
 *               passengers:
 *                 type: integer
 *               travel_date:
 *                 type: string
 *                 format: date
 *               travel_time:
 *                 type: string
 *                 format: time
 *     responses:
 *       201:
 *         description: Created
 */
exports.createRequest = catchAsync(async (req, res) => {
  const { error, value } = createRequestSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  const requestId = await RequestService.createRequest(req.user, value, req.ip);

  res.status(201).json({
    status: 'success',
    message: 'Vehicle request submitted successfully.',
    requestId
  });
});

// ─── UPDATE REQUEST ────────────────────────────────────────

/**
 * @swagger
 * /api/requests/{id}:
 *   put:
 *     summary: Edit an existing pending request
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Updated successfully
 */
exports.updateRequest = catchAsync(async (req, res) => {
  const { error, value } = createRequestSchema.validate(req.body);
  if (error) {
    throw new AppError(error.details[0].message, 400);
  }

  await RequestService.editRequest(req.params.id, req.user.id, value);

  res.status(200).json({
    status: 'success',
    message: 'Vehicle request updated successfully.'
  });
});

// ─── GET MY REQUESTS ───────────────────────────────────────

/**
 * @swagger
 * /api/requests/my:
 *   get:
 *     summary: Get logged-in employee's requests
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of requests
 */
exports.getMyRequests = catchAsync(async (req, res) => {
  const { from_date, to_date, type } = req.query;
  const requests = await RequestService.getMyRequests(req.user.id, { from_date, to_date, type });
  res.json({
    status: 'success',
    requests
  });
});

// ─── EXPORT MY REQUESTS AS CSV (opens in Excel) ───────────
exports.exportMyRequests = catchAsync(async (req, res) => {
  const { from_date, to_date, type } = req.query;
  const requests = await RequestService.getMyRequests(req.user.id, { from_date, to_date, type });

  const escape = (val) => {
    if (val == null) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const headers = [
    'Request ID', 'Status', 'Travel Type', 'Destination', 'Pickup Location',
    'Purpose', 'Requested On', 'Travel Date', 'Travel Time', 'Return Date',
    'Return Time', 'Passengers', 'Vehicle Registration', 'Assigned Driver',
    'HOD Remarks', 'COO Remarks'
  ];

  const rows = requests.map(req => [
    req.id,
    req.status.replace(/_/g, ' '),
    req.travel_type,
    req.destination,
    req.pickup_location,
    req.purpose,
    new Date(req.created_at).toLocaleString('en-IN'),
    req.travel_date,
    req.travel_time,
    req.return_date || 'N/A',
    req.return_time || 'N/A',
    req.passengers,
    req.registration_no || 'Not Assigned',
    req.assigned_driver || 'Not Assigned',
    req.hod_remarks || '',
    req.coo_remarks || ''
  ].map(escape));

  // UTF-8 BOM ensures Excel opens the file correctly with all characters
  const BOM = '\uFEFF';
  const csv = BOM + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="Request_History.csv"');
  res.setHeader('Cache-Control', 'no-cache');
  res.send(csv);
});

// ─── GET SINGLE REQUEST ────────────────────────────────────

/**
 * @swagger
 * /api/requests/{id}:
 *   get:
 *     summary: Get single request by ID
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Request details
 */
exports.getRequestById = catchAsync(async (req, res) => {
  const request = await RequestService.getRequestDetails(req.params.id, req.user);
  res.json({
    status: 'success',
    request
  });
});

// ─── DELETE REQUEST ────────────────────────────────────────

/**
 * @swagger
 * /api/requests/{id}/delete:
 *   patch:
 *     summary: Delete a pending request
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Request deleted
 */
exports.deleteRequest = catchAsync(async (req, res) => {
  await RequestService.deleteRequest(req.params.id, req.user, req.ip);
  res.json({
    status: 'success',
    message: 'Request deleted successfully.'
  });
});

// ─── GET ALL REQUESTS (Admin) ──────────────────────────────

/**
 * @swagger
 * /api/requests/all:
 *   get:
 *     summary: Admin get all requests
 *     tags: [Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated list of requests
 */
exports.getAllRequests = catchAsync(async (req, res) => {
  const { status, department_id, page, limit } = req.query;
  const result = await RequestService.getAllRequests({ status, department_id }, page, limit);

  res.json({
    status: 'success',
    ...result
  });
});

// ─── GET REQUEST HISTORY ───────────────────────────────────
exports.getRequestHistory = catchAsync(async (req, res) => {
  const history = await RequestService.getRequestHistory(req.params.id, req.user);
  res.json({
    status: 'success',
    data: history
  });
});
