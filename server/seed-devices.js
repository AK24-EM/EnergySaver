import 'dotenv/config';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Device from './models/Device.js';
import User from './models/User.js';
import Home from './models/Home.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Seed Database with Sample Devices
 * 
 * Usage:
 *   node server/seed-devices.js <email>
 * 
 * Example:
 *   node server/seed-devices.js user@example.com
 */

const seedDevices = async () => {
    try {
        // Get email from command line argument
        const userEmail = process.argv[2];

        if (!userEmail) {
            console.error('❌ Error: Please provide user email as argument');
            console.log('Usage: node server/seed-devices.js <email>');
            console.log('Example: node server/seed-devices.js user@example.com');
            process.exit(1);
        }

        // Connect to MongoDB
        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/energysaver');
        console.log('✅ Connected to MongoDB');

        // Find user
        console.log(`🔍 Looking for user: ${userEmail}`);
        const user = await User.findOne({ email: userEmail }).populate('home');

        if (!user) {
            console.error(`❌ User not found with email: ${userEmail}`);
            console.log('\n💡 Tip: Register a user first or use an existing email');
            process.exit(1);
        }

        if (!user.home) {
            console.error('❌ User does not have a home associated');
            process.exit(1);
        }

        console.log(`✅ Found user: ${user.name}`);
        console.log(`🏠 Home: ${user.home.name}`);

        // Load sample devices
        const sampleDevicesPath = path.join(__dirname, '..', 'sample-devices.json');
        console.log(`📄 Loading sample devices from: ${sampleDevicesPath}`);

        const sampleDevices = JSON.parse(fs.readFileSync(sampleDevicesPath, 'utf8'));
        console.log(`📦 Found ${sampleDevices.length} sample devices`);

        // Delete existing devices for this home (optional - comment out to keep existing)
        const existingCount = await Device.countDocuments({ home: user.home._id });
        if (existingCount > 0) {
            console.log(`⚠️  Found ${existingCount} existing devices`);
            console.log('🗑️  Deleting existing devices...');
            await Device.deleteMany({ home: user.home._id });
            console.log('✅ Existing devices deleted');
        }

        // Create devices
        console.log('🔨 Creating sample devices...');
        const createdDevices = [];

        for (const deviceData of sampleDevices) {
            const device = new Device({
                ...deviceData,
                home: user.home._id,
                status: 'off',
                isActive: false,
                currentPower: 0
            });

            await device.save();
            createdDevices.push(device);
            console.log(`  ✓ Created: ${device.name} (${device.category}, ${device.ratedPower}W)`);
        }

        console.log(`\n✅ Successfully created ${createdDevices.length} devices!`);

        // Summary
        console.log('\n📊 Device Summary:');
        const categories = {};
        createdDevices.forEach(device => {
            categories[device.category] = (categories[device.category] || 0) + 1;
        });

        Object.entries(categories).forEach(([category, count]) => {
            console.log(`  ${category}: ${count} device(s)`);
        });

        const totalPower = createdDevices.reduce((sum, device) => sum + device.ratedPower, 0);
        console.log(`\n⚡ Total Rated Power: ${totalPower}W (${(totalPower / 1000).toFixed(2)}kW)`);

        console.log('\n🎉 Database seeding completed successfully!');
        console.log(`\n💡 Next steps:`);
        console.log(`   1. Start the server: npm run server`);
        console.log(`   2. Login to the app with: ${userEmail}`);
        console.log(`   3. Navigate to the Devices page to see your devices`);
        console.log(`   4. Toggle devices ON to start generating usage data`);

    } catch (error) {
        console.error('❌ Error seeding database:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n📡 MongoDB connection closed');
    }
};

// Run the seeder
seedDevices();
