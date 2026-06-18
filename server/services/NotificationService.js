const NotificationRepository = require('../repositories/NotificationRepository');
const UserRepository = require('../repositories/UserRepository');
const EmailService = require('./EmailService');

class NotificationService {
  async sendPasswordResetEmail(user, token) {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetUrl}.<br/>If you didn't forget your password, please ignore this email!`;

    await EmailService.sendEmail(
      user.email,
      'Your password reset token (valid for 10 min)',
      message
    );
  }

  /**
   * Unified notification sender: Creates DB entry, emits socket event, and sends email.
   */
  async notifyUser(userId, title, message, type = 'System') {
    try {
      // 1. Save to DB
      const id = await NotificationRepository.createNotification(userId, title, message, type);

      // 2. Emit Real-time Event
      // [TEMPORARILY DISABLED as per user request]
      // try {
      //   socketUtil.getIO().to(`user_${userId}`).emit('notification', { id, title, message, type, is_read: 0, created_at: new Date() });
      // } catch (err) {
      //   logger.error('Socket emission failed in notifyUser', err);
      // }

      // 3. Send Email
      const user = await UserRepository.findById(userId);
      if (user && user.email) {
        await EmailService.sendEmail(
          user.email,
          title,
          `<p>${message}</p>`
        );
      }
    } catch (err) {
      logger.error('Failed to notify user', err);
    }
  }

  async getMyNotifications(userId) {
    return await NotificationRepository.getMyNotifications(userId);
  }

  async markAsRead(id, userId) {
    await NotificationRepository.markAsRead(id, userId);
  }

  async markAllAsRead(userId) {
    await NotificationRepository.markAllAsRead(userId);
  }
}

module.exports = new NotificationService();
