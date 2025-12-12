import mongoose from 'mongoose';
import notificationService from '../server/services/notificationService.js';
import User from '../server/models/User.js';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/energysaver', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB error:', err));

async function testNotification() {
    try {
        // Find a user
        const user = await User.findOne({ email: 'settings_tester_01@example.com' }); // Ensure this matches your test user
        if (!user) {
            console.log('Test user not found');
            process.exit(1);
        }

        console.log('Sending test notification to:', user.email);

        await notificationService.sendNotification(user, 'test', {
            email: {
                subject: 'Test Notification',
                html: '<p>This is a test notification from the verification script.</p>'
            },
            push: {
                title: 'Test Notification',
                body: 'This is a test push notification.'
            },
            category: 'tips' // Assuming 'tips' is enabled or not disabled
        });

        console.log('Notification sent via service');

    } catch (error) {
        console.error('Test error:', error);
    } finally {
        mongoose.disconnect();
    }
}

// Wait for connection before running
mongoose.connection.once('open', testNotification);
