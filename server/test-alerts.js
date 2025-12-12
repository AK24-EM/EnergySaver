
import 'dotenv/config';
import mongoose from 'mongoose';
import Alert from './models/Alert.js';
import { createAlert, getActiveAlerts } from './services/alertService.js';

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/energysaver');
        console.log('Connected to DB');

        // Create dummy home ID
        const homeId = new mongoose.Types.ObjectId();

        console.log('Creating Test Alert...');
        const alert = await createAlert({
            home: homeId,
            title: 'High Usage Warning',
            type: 'limit',
            severity: 'warning',
            message: 'Usage exceeded 10kWh',
            status: 'active',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
        console.log('Alert Created:', alert._id);

        console.log('Fetching Active Alerts...');
        const alerts = await getActiveAlerts(homeId);
        console.log('Active Alerts Count:', alerts.length);
        console.log('First Alert Title:', alerts[0]?.title);
        console.log('First Alert Status:', alerts[0]?.status);

        if (alerts.length > 0 && alerts[0].title === 'High Usage Warning') {
            console.log('TEST PASSED');
            await Alert.deleteMany({ home: homeId }); // Cleanup
        } else {
            console.log('TEST FAILED');
        }

        process.exit(0);
    } catch (error) {
        console.error('TEST FAILED with error:', error);
        process.exit(1);
    }
};

runTest();
