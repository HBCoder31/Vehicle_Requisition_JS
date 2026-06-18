/**
 * Role-Based Access Control (RBAC) Middleware
 *
 * Usage:
 *   router.get('/admin-only', authenticate, authorize('Admin'), handler)
 *   router.get('/managers',   authenticate, authorize('HOD', 'COO', 'Admin'), handler)
 *
 * Must be used AFTER the `authenticate` middleware (needs req.user).
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied. Insufficient permissions.',
        required: allowedRoles,
        current: req.user.role,
      });
    }

    next();
  };
}

module.exports = { authorize };
