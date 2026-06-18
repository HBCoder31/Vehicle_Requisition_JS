const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { pool } = require('./db');

/**
 * Google OAuth 2.0 Strategy for Passport.js
 *
 * Flow:
 * 1. User clicks "Sign in with Google"
 * 2. Redirected to Google consent screen
 * 3. Google calls back with profile info
 * 4. We look up the email in our employees table
 * 5. If found → set google_id + avatar, return employee record
 * 6. If not found → deny access
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(null, false, { message: 'No email found in Google profile' });
        }

        // Look up employee by email
        const [rows] = await pool.execute(
          'SELECT * FROM employees WHERE email = ? AND is_active = 1',
          [email]
        );

        if (rows.length === 0) {
          // User is not in our system — deny access
          return done(null, false, {
            message: 'Access denied. Your email is not registered in the system.',
          });
        }

        const employee = rows[0];

        // Update google_id and avatar on first/subsequent logins
        await pool.execute(
          'UPDATE employees SET google_id = ?, avatar_url = ? WHERE id = ?',
          [profile.id, profile.photos?.[0]?.value || null, employee.id]
        );

        // Return the employee record (used to create JWT)
        return done(null, {
          id: employee.id,
          email: employee.email,
          full_name: employee.full_name,
          role: employee.role,
          department_id: employee.department_id,
          avatar_url: profile.photos?.[0]?.value || employee.avatar_url,
        });
      } catch (err) {
        console.error('Google OAuth error:', err);
        return done(err, null);
      }
    }
  )
);

// Serialize/deserialize (minimal — we use JWT, not sessions)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, email, full_name, role, department_id, avatar_url FROM employees WHERE id = ?',
      [id]
    );
    done(null, rows[0] || null);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
