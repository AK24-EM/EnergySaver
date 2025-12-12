import webpush from 'web-push';
import logger from '../utils/logger.js';
import User from '../models/User.js';

class PushService {
    constructor() {
        // VAPID keys should be in environment variables in production
        const vapidKeys = {
            publicKey: process.env.VAPID_PUBLIC_KEY || 'BFJFG-SQBPrRa0egs88MwOIrkZfSGvQqnfpIBRQQoJEsjNIQ7FZaZFQRDRG6jv9FEHJn_CpTxZcUPrFBCt_uR6E',
            privateKey: process.env.VAPID_PRIVATE_KEY || '-Wr7d6qgMs5y5U8fqfy6tBu_n5VVARhIxzja2MANK84'
        };

        webpush.setVapidDetails(
            'mailto:admin@energysaver.com',
            vapidKeys.publicKey,
            vapidKeys.privateKey
        );
    }

    getPublicKey() {
        return process.env.VAPID_PUBLIC_KEY || 'BFJFG-SQBPrRa0egs88MwOIrkZfSGvQqnfpIBRQQoJEsjNIQ7FZaZFQRDRG6jv9FEHJn_CpTxZcUPrFBCt_uR6E';
    }

    async sendNotification(subscription, payload) {
        try {
            await webpush.sendNotification(subscription, JSON.stringify(payload));
        } catch (error) {
            logger.error('Error sending push notification:', error);
            if (error.statusCode === 410) {
                // Subscription is no longer valid, should be removed
                logger.info('Subscription has expired or is no longer valid: ', subscription.endpoint);
                return 'gone';
            }
            throw error;
        }
    }

    async sendToUser(userId, payload) {
        try {
            const user = await User.findById(userId);
            if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
                return;
            }

            const notifications = user.pushSubscriptions.map(async (sub) => {
                try {
                    const result = await this.sendNotification(sub, payload);
                    if (result === 'gone') {
                        // Mark for removal
                        return sub.endpoint;
                    }
                } catch (err) {
                    console.error('Failed to send to one subscription', err);
                }
            });

            const results = await Promise.all(notifications);
            const endpointsToRemove = results.filter(r => r);

            if (endpointsToRemove.length > 0) {
                await User.updateOne(
                    { _id: userId },
                    { $pull: { pushSubscriptions: { endpoint: { $in: endpointsToRemove } } } }
                );
            }

        } catch (error) {
            logger.error(`Error sending push to user ${userId}:`, error);
        }
    }
}

export default new PushService();
