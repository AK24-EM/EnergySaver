import 'dotenv/config';
import mongoose from 'mongoose';
import { createAlert } from './services/alertService.js';

const createTestAlert = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/energysaver');
        console.log('Connected to DB');

        // Get the first home from the database
        const Home = (await import('./models/Home.js')).default;
        const home = await Home.findOne();

        if (!home) {
            console.error('No home found. Please create a home first.');
            process.exit(1);
        }

        console.log(`Creating critical alert for home: ${home.name}`);

        const alert = await createAlert({
            home: home._id,
            title: 'Critical: High Power Usage Detected',
            type: 'limit',
            severity: 'critical',
            message: 'Your energy consumption has exceeded 15 kWh today. This may result in higher costs.',
            status: 'active',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
            data: {
                estimatedCost: 825.50
            }
        });

        console.log('✅ Critical alert created successfully!');
        console.log('Alert ID:', alert._id);
        console.log('Title:', alert.title);
        console.log('Severity:', alert.severity);
        console.log('\nCheck your dashboard - you should see a notification badge on the bell icon!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to create alert:', error);
        process.exit(1);
    }
};

createTestAlert();
