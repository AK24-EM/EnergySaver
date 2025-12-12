import mongoose from 'mongoose';
import User from '../server/models/User.js';
import Home from '../server/models/Home.js';

mongoose.connect('mongodb://localhost:27017/energysaver', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB error:', err));

async function seedUser() {
    try {
        const email = 'settings_tester_01@example.com';

        // Clean up existing
        await User.deleteOne({ email });
        const existingHome = await Home.findOne({ name: 'Test Home' });
        if (existingHome) {
            await Home.deleteOne({ _id: existingHome._id });
        }

        // 1. Create User first (temporarily without home)
        const user = new User({
            name: 'Settings Tester',
            email: email,
            password: 'password123',
            role: 'user',
            // home: will be added later
            preferences: {
                notifications: {
                    email: true,
                    push: true,
                    categories: { tips: true }
                }
            }
        });
        await user.save();

        // 2. Create Home with owner
        const home = new Home({
            name: 'Test Home',
            owner: user._id,
            address: '123 Test St',
            timezone: 'Asia/Kolkata',
            tariffPlan: { type: 'flat', flatRate: 5.5, currency: 'INR' }
        });
        await home.save();

        // 3. Update User with Home
        user.home = home._id;
        await user.save();

        console.log('Test user and home created');

        // Push subscription for visual check if needed (mock)
        /*
        user.pushSubscriptions.push({
            endpoint: 'https://fcm.googleapis.com/fcm/send/mock-endpoint',
            keys: { p256dh: 'mock', auth: 'mock' }
        });
        await user.save();
        */

    } catch (error) {
        console.error('Seed error:', error);
    } finally {
        mongoose.disconnect();
    }
}

mongoose.connection.once('open', seedUser);
