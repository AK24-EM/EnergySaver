import emailService from './emailService.js';
import pushService from './pushService.js';
import logger from '../utils/logger.js';
import User from '../models/User.js';

class NotificationService {

    async sendNotification(user, type, payload) {
        if (!user || !user.preferences || !user.preferences.notifications) {
            logger.warn(`User ${user?._id} has no notification preferences configured.`);
            return;
        }

        const prefs = user.preferences.notifications;

        // Check global quiet hours
        if (prefs.quietHours && prefs.quietHours.enabled) {
            if (this.isQuietHours(prefs.quietHours)) {
                logger.info(`Notification suppressed due to quiet hours for user ${user._id}`);
                return;
            }
        }

        // Check category preferences if applicable based on type
        // Assuming payload has a 'category' field corresponding to prefs.categories
        if (payload.category && prefs.categories) {
            if (prefs.categories[payload.category] === false) {
                logger.info(`Notification suppressed due to category '${payload.category}' preference for user ${user._id}`);
                return;
            }
        }

        const notifications = [];

        // Send Email
        if (prefs.email && payload.email) {
            notifications.push(
                emailService.sendEmail(user.email, payload.email.subject, payload.email.html)
                    .catch(err => logger.error(`Failed to send email to ${user.email}`, err))
            );
        }

        // Send Push
        if (prefs.push && payload.push) {
            notifications.push(
                pushService.sendToUser(user._id, payload.push)
                    .catch(err => logger.error(`Failed to send push to ${user._id}`, err))
            );
        }

        // SMS not implemented
        if (prefs.sms) {
            // Placeholder for SMS service
        }

        await Promise.all(notifications);
    }

    isQuietHours(quietHours) {
        if (!quietHours.start || !quietHours.end) return false;

        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const start = quietHours.start;
        const end = quietHours.end;

        if (start < end) {
            return currentTime >= start && currentTime <= end;
        } else {
            // Crosses midnight, e.g. 22:00 to 07:00
            return currentTime >= start || currentTime <= end;
        }
    }
}

export default new NotificationService();
